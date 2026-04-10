# Piano Operativo | Period Management Leave Request

**Data:** 2026-04-10  
**Ambito:** `doc/workflow/period_management_leave_request`  
**Obiettivo:** tradurre l'analisi delle issue in un piano operativo concreto, senza introdurre modifiche di codice in questo passaggio.

## 1. Sintesi Esecutiva

L'analisi del codice mostra che le tre issue sono reali ma non tutte sono state diagnosticate correttamente nei documenti esistenti.

- **Issue 1**: il problema principale non e' solo la mancanza di una branch per on-behalf pre-approvato, ma soprattutto un mismatch di casing tra frontend e backend sul campo `status`, con un ulteriore rischio di bypass autorizzativo nella soluzione attualmente descritta.
- **Issue 2**: la sola uniformazione della trasformazione delle date non basta; l'algoritmo di overlap continua a ragionare per `dayPart`, mentre il nuovo modello richiede un controllo su intervalli temporali reali.
- **Issue 3**: il sintomo "2 days invece di 1 hour" e' principalmente un errore di rappresentazione/calcolo nella UI approvazioni, non un problema primario di notification timing.

## 2. Evidenze Verificate

### 2.1 Issue 1

**Riferimenti principali**

- `components/requests/leave-request-form.tsx:162`
- `components/requests/leave-request-form.tsx:546`
- `app/api/leave-requests/route.ts:244`
- `app/api/leave-requests/route.ts:262`
- `lib/generated/prisma/enums.ts:12`
- `doc/prd/prd_period_management_leave_request.md:29`

**Osservazioni**

- Il form admin invia valori `APPROVED`, `NEW`, `REJECTED` in maiuscolo.
- Gli enum Prisma importati nel backend hanno valori runtime in minuscolo: `approved`, `new`, `rejected`.
- I branch del backend che confrontano `bodyStatus` con `LeaveStatus.APPROVED` e `LeaveStatus.REJECTED` possono quindi non attivarsi correttamente.
- La branch attuale che accetta genericamente uno status terminale per richieste non admin introduce un rischio di autorizzazione: un utente non privilegiato potrebbe tentare di forzare uno status terminale via payload.

### 2.2 Issue 2

**Riferimenti principali**

- `lib/leave-validation-service.ts:2`
- `lib/leave-validation-service.ts:224`
- `lib/leave-validation-service.ts:253`
- `lib/leave-validation-service.ts:266`
- `app/api/leave-requests/route.ts:46`
- `doc/prd/prd_period_management_leave_request.md:52`
- `doc/prd/prd_period_management_leave_request.md:88`

**Osservazioni**

- La validazione overlap riusa la trasformazione delle date, ma il filtro iniziale e il controllo finale restano concettualmente basati su giorno/day-part.
- Le richieste custom vengono normalizzate a `ALL` per `dayPartStart/dayPartEnd`, quindi il `dayPart` non puo' essere usato come discriminante affidabile per richieste time-based.
- L'import di `getPresetDateRange` direttamente dal route handler crea anche un accoppiamento improprio tra livello API e logica di dominio.

### 2.3 Issue 3

**Riferimenti principali**

- `app/(dashboard)/approvals/approvals-dashboard.tsx:234`
- `app/(dashboard)/approvals/approvals-dashboard.tsx:335`
- `doc/prd/prd_period_management_leave_request.md:51`
- `doc/prd/prd_period_management_leave_request.md:52`

**Osservazioni**

- La UI approvazioni mostra la durata usando una formula basata sulla differenza in giorni di calendario.
- Una richiesta nello stesso giorno da 17:00 a 18:00 puo' essere mostrata come `2 days`.
- Questo confligge con il PRD, che definisce `durationMinutes` come source of truth per i calcoli business e per la rappresentazione coerente.

## 3. Soluzione Operativa Per Issue

### 3.1 Issue 1 | Status override e on-behalf flow

**Soluzione da implementare**

1. Introdurre una normalizzazione esplicita del campo `status` in ingresso.
2. Validare il `status` rispetto a un insieme consentito, con parsing coerente rispetto agli enum Prisma runtime.
3. Consentire override terminali solo in presenza di privilegi adeguati.
4. Lasciare il workflow attivo quando lo status richiesto e' `NEW`.
5. Impostare `approverId` e `decidedAt` solo nei casi autorizzati e realmente terminali.
6. Saltare creazione `approval_steps` e routing workflow solo se la decisione terminale e' valida e autorizzata.

**Decisione di dominio proposta**

- La semantica corretta resta quella del PRD: l'on-behalf con status diverso da `NEW` e' una capability amministrativa.
- Non va introdotto alcun bypass "tollerante" per utenti non admin.

**Rischi da evitare**

- Accettare `bodyStatus` terminale da utenti normali.
- Salvare `status` incoerenti per differenze di casing.
- Attribuire `approverId` a un attore che non aveva diritto di approvare.

### 3.2 Issue 2 | Overlap detection su intervalli reali

**Soluzione da implementare**

1. Estrarre `resolveWorkdayBounds`, `applyTimeToDate` e `getPresetDateRange` in un helper condiviso di dominio.
2. Riutilizzare quel helper sia in persistenza sia in validazione.
3. Trasformare sempre la richiesta corrente in un intervallo temporale reale `persistedDateStart/persistedDateEnd`.
4. Effettuare la ricerca overlap su timestamp reali.
5. Effettuare il conflitto finale con logica interval-vs-interval:
   - conflitto se `newStart < existingEnd` e `newEnd > existingStart`
   - nessun conflitto per slot adiacenti senza intersezione
6. Ridurre l'uso di `dayPart` a semplice metadata di input o compatibilita' storica.

**Decisione di dominio proposta**

- Il sistema deve considerare il tempo reale come unita' di verita' per overlap e durata.
- `dayPart` non deve piu' guidare la decisione finale nei casi time-based.

**Rischi da evitare**

- Continuare a usare `ALL/MORNING/AFTERNOON` come sostituto di un intervallo reale.
- Lasciare la logica overlap dipendente dal route handler.
- Introdurre regressioni sui casi legacy mezza giornata.

### 3.3 Issue 3 | Durata errata nella UI approvazioni

**Soluzione da implementare**

1. Rimuovere il calcolo locale della durata basato sui giorni di calendario nella UI approvazioni.
2. Usare `durationMinutes` dal backend oppure un helper condiviso che formatti la durata da minuti.
3. Mostrare ore/minuti come formato primario.
4. Aggiungere, se utile, il valore approssimato in company days usando `minutesPerDay`.

**Decisione di dominio proposta**

- La UI approvazioni deve rappresentare il periodo in modo coerente con il modello time-based.
- Il problema non va trattato come difetto di notifica finche' non emergono evidenze reali di backlog o delayed dispatch.

**Rischi da evitare**

- Correggere solo la coda notifiche lasciando invariata la UI.
- Mantenere formule duplicate e divergenti tra schermate diverse.

## 4. Piano Di Implementazione

### Fase 1 | Correzione sicurezza e correttezza stato

**Priorita': P0**

1. Normalizzare `status` nel route handler di creazione richiesta.
2. Limitare gli override terminali ad attori autorizzati.
3. Allineare il frontend admin e il backend sul formato di `status`.
4. Aggiungere test di regressione per:
   - admin on-behalf con `APPROVED`
   - admin on-behalf con `REJECTED`
   - admin on-behalf con `NEW`
   - utente non admin che prova a forzare `APPROVED`

### Fase 2 | Refactor overlap time-based

**Priorita': P0**

1. Estrarre helper condivisi per la risoluzione dell'intervallo persistito.
2. Rifattorizzare `detectOverlaps` per lavorare su timestamp reali.
3. Coprire test di regressione per:
   - slot non sovrapposti nello stesso giorno
   - slot parzialmente sovrapposti
   - slot adiacenti
   - preset vs custom
   - multi-day vs single-day custom

### Fase 3 | Correzione UI approvazioni

**Priorita': P1**

1. Eliminare la formula days-based in `approvals-dashboard`.
2. Introdurre formatter condiviso per durata.
3. Verificare consistenza con requests list, request detail e form.

### Fase 4 | Verifica notifiche

**Priorita': P2**

1. Riesaminare i casi notifiche solo dopo le correzioni di Fase 1 e 2.
2. Verificare se restano sintomi reali di delay lato outbox/worker.
3. Solo in presenza di evidenze, aprire issue separata su notification processing.

## 5. Test Plan

### 5.1 Test funzionali

- Admin crea richiesta per altro utente con stato `APPROVED`: richiesta subito approvata, nessun `approval_step`.
- Admin crea richiesta per altro utente con stato `NEW`: richiesta pendente, workflow attivo.
- Utente standard invia payload con `status=APPROVED`: richiesta rifiutata o ignorata secondo regola definita.
- Richiesta 17:00-18:00 senza overlap reale: accettata.
- Richiesta 10:30-12:00 con esistente 09:00-11:00: bloccata.
- Richiesta 11:00-12:00 con esistente 09:00-11:00: non bloccata se l'intervallo e' solo adiacente.
- Dashboard approvazioni per richiesta 17:00-18:00: visualizza `1h`, non `2 days`.

### 5.2 Test di sicurezza

- Nessun utente non admin puo' bypassare workflow tramite `status` nel body.
- Nessun utente non admin puo' creare richieste per altri utenti.
- `approverId` e `decidedAt` sono valorizzati solo nei casi autorizzati.

### 5.3 Test di regressione

- Preset `ALL`, `MORNING`, `AFTERNOON` continuano a funzionare nei casi legacy.
- Richieste multi-day continuano a rispettare schedule e bank holidays.
- Notifiche per richieste realmente `APPROVED` continuano a essere enqueue-ate correttamente.

## 6. File Coinvolti Nella Successiva Implementazione

**Core**

- `app/api/leave-requests/route.ts`
- `lib/leave-validation-service.ts`
- nuovo helper condiviso per intervalli leave request

**Frontend**

- `components/requests/leave-request-form.tsx`
- `app/(dashboard)/approvals/approvals-dashboard.tsx`

**Test**

- test route creazione leave request
- test validation overlap
- test UI/formatter durata approvazioni

## 7. Ordine Consigliato Di Esecuzione

1. Fix Issue 1 per rimuovere il rischio autorizzativo.
2. Fix Issue 2 per riallineare il modello time-based alla validazione.
3. Fix Issue 3 in UI come correzione di rappresentazione.
4. Verifica finale end-to-end con casi admin, custom range e approval dashboard.

## 8. Esito Atteso

Al termine dell'implementazione:

- l'override di stato sara' coerente, sicuro e conforme al PRD;
- l'overlap detection sara' basata su intervalli temporali reali;
- la UI approvazioni mostrera' durate corrette per richieste orarie;
- le eventuali anomalie residue sulle notifiche potranno essere valutate su base reale e non inferenziale.

## 9. Checklist Esecutiva

### 9.1 Preparazione

- [x] Rileggere i vincoli del PRD time-based e del flusso admin on-behalf.
- [x] Confermare i file target dell'intervento prima di iniziare le modifiche.
- [x] Verificare se esistono test gia' presenti per `POST /api/leave-requests` e overlap detection.

### 9.2 Issue 1 | Status override e sicurezza

- [x] Introdurre parsing/normalizzazione esplicita di `bodyStatus` nel backend.
- [x] Rendere il parsing tollerante al casing solo come normalizzazione tecnica, non come allargamento autorizzativo.
- [x] Rimuovere il branch che consente status terminali a utenti non admin.
- [x] Mantenere il comportamento admin on-behalf: default `APPROVED`, override esplicito ammesso.
- [x] Assicurare che `NEW` segua il workflow e non imposti `decidedAt`.
- [x] Assicurare che `APPROVED/REJECTED` autorizzati impostino `approverId` e `decidedAt`.
- [x] Verificare che non vengano creati `approval_steps` per decisioni gia' terminali.
- [x] Allineare il frontend admin al formato status deciso come canonico.
- [x] Aggiungere test per admin on-behalf `APPROVED`.
- [x] Aggiungere test per admin on-behalf `REJECTED`.
- [x] Aggiungere test per admin on-behalf `NEW`.
- [x] Aggiungere test negativo per utente non admin con `status=APPROVED`.

### 9.3 Issue 2 | Overlap detection time-based

- [x] Estrarre gli helper di risoluzione intervallo da `app/api/leave-requests/route.ts` in un modulo condiviso.
- [x] Aggiornare il route handler per usare il nuovo helper condiviso.
- [x] Aggiornare `LeaveValidationService` per usare lo stesso helper condiviso.
- [x] Eliminare la dipendenza diretta di `leave-validation-service` dal route handler API.
- [x] Trasformare la richiesta corrente in `persistedDateStart/persistedDateEnd` prima del controllo overlap.
- [x] Sostituire il conflitto finale basato su `dayPart` con controllo interval-vs-interval.
- [x] Gestire correttamente gli intervalli adiacenti come non conflittuali.
- [x] Verificare i casi legacy `ALL/MORNING/AFTERNOON`.
- [x] Aggiungere test per custom range non sovrapposti nello stesso giorno.
- [x] Aggiungere test per custom range con overlap parziale.
- [x] Aggiungere test per slot adiacenti.
- [x] Aggiungere test per preset vs custom.
- [x] Aggiungere test per multi-day vs single-day.

### 9.4 Issue 3 | UI approvazioni

- [ ] Rimuovere il calcolo locale days-based da `approvals-dashboard`.
- [ ] Usare `durationMinutes` o formatter condiviso come unica fonte per la durata mostrata.
- [ ] Mostrare ore/minuti come rappresentazione primaria per richieste time-based.
- [ ] Verificare consistenza visuale con form richiesta, dettaglio richiesta e altre liste.
- [ ] Aggiungere test o verifica manuale per richiesta da 1 ora mostrata correttamente.

### 9.5 Verifica notifiche post-fix

- [ ] Rieseguire il caso end-to-end dopo i fix di Issue 1 e 2.
- [ ] Verificare se le notifiche risultano corrette una volta corretto lo stato reale della richiesta.
- [ ] Aprire una issue separata sulle notifiche solo se resta un ritardo riproducibile.

### 9.6 Validazione finale

- [ ] Verificare che un admin possa creare on-behalf con stato terminale autorizzato.
- [ ] Verificare che un utente standard non possa forzare bypass workflow.
- [ ] Verificare che uno slot custom libero venga accettato.
- [ ] Verificare che uno slot custom realmente sovrapposto venga bloccato.
- [ ] Verificare che la approval dashboard non mostri piu' `2 days` per richieste da un'ora.
- [ ] Rieseguire i test di regressione rilevanti.
- [ ] Aggiornare il documento con eventuali deviazioni emerse in implementazione.
