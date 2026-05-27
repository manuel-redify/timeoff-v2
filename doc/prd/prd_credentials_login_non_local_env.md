# PRD Analysis - Credentials Login in Non-Local Environments
**Version:** v1
**Date:** 2026-05-27
**Source Review:** `auth.ts`, `app/login/page.tsx`, `lib/actions/user.ts`, `scripts/seed.ts`, `prisma/schema.prisma`, `doc/prd/prd_auth_migration.md`, `doc/documentation/user_creation.md`

## Objective

Abilitare il login via email/password anche fuori dall'ambiente locale, mantenendolo governabile tramite variabile d'ambiente ma senza introdurre un vettore di accesso debole rispetto al flusso Google OAuth già esistente.

L'obiettivo reale non è solo "mostrare il form anche online", ma introdurre un meccanismo di fallback credenziale che sia:

- sicuro in ambienti Internet-facing;
- revocabile rapidamente;
- compatibile con il modello multi-tenant esistente;
- gestibile in modo semplice per supporto, demo, break-glass e ambienti di staging/UAT;
- implementabile con modifiche limitate rispetto all'architettura attuale.

## Current State

### Authentication wiring

- In `auth.ts` esistono già due provider:
  - `google`, attivo in produzione o se `NEXT_PUBLIC_ENABLE_OAUTH_IN_DEV === "true"`;
  - `credentials`, attivo solo se `NODE_ENV === "development"`.
- In `app/login/page.tsx` il form email/password viene renderizzato solo in sviluppo:
  - `const showCredentialsForm = mounted ? process.env.NODE_ENV === "development" : false;`
- Il provider credentials valida:
  - presenza di `email` e `password`;
  - esistenza utente;
  - `activated === true`;
  - `bcrypt.compare(password, user.password || "")`.

### Data model

- In `prisma/schema.prisma`, `User` ha già:
  - `password String?`
  - `activated Boolean`
  - `endDate DateTime?`
  - `companyId`
  - relazioni `sessions` e `accounts`
- Quindi il supporto dati per un login a credenziali esiste già.

### Provisioning password oggi

- In `lib/actions/user.ts`, alla creazione utente:
  - la password viene valorizzata solo in `development`;
  - viene usata una costante hardcoded `TempPassword123!`;
  - la stessa password viene inviata via email nei contesti non production.
- In `scripts/seed.ts` l'admin iniziale viene creato con:
  - `process.env.DEV_DEFAULT_PASSWORD || "admin123"`.

### Session management

- In `auth.ts` la sessione usa `strategy: "jwt"`.
- Questo significa che la revoca di un utente disattivato o scaduto non è immediata per tutte le sessioni già emesse, salvo controlli applicativi aggiuntivi lungo le request path.

## Security Assessment

### Rischi attuali se si abilita semplicemente il form online

Se si introducesse solo una env var del tipo `ENABLE_CREDENTIALS_LOGIN=true` riusando l'impianto attuale, il risultato sarebbe insufficiente dal punto di vista sicurezza.

#### Risk 1: shared/static passwords

- Il sistema oggi prevede password temporanee statiche o con fallback debole.
- In particolare:
  - `TempPassword123!` è hardcoded;
  - `admin123` è un fallback molto debole.
- Questo è incompatibile con un ambiente esposto su Internet.

#### Risk 2: no first-login reset enforcement

- La documentazione parla di password temporanea e reset al primo accesso, ma nel codice analizzato non emerge un enforcement attivo del cambio password al primo login.
- Se una password iniziale viene distribuita e non scade, diventa una credenziale persistente di basso valore.

#### Risk 3: no dedicated rate limiting / brute-force protection

- Nel codice analizzato non emerge una protezione esplicita contro:
  - brute force per IP;
  - credential stuffing;
  - lockout progressivo per utente;
  - captcha o challenge adaptive.
- Un endpoint credentials Internet-facing senza rate limiting è un rischio concreto.

#### Risk 4: session revocation not immediate

- Con sessione JWT, la disattivazione utente non invalida di per sé il token già emesso.
- Per un canale di login con password questo è meno accettabile rispetto a un accesso solo OAuth.

#### Risk 5: feature flag only on UI would be bypassable

- Nascondere o mostrare il form lato UI non è sufficiente.
- Se il provider `credentials` resta registrato server-side, un client può comunque colpire il relativo endpoint anche senza il form visibile.

#### Risk 6: possible password presence ambiguity across environments

- Oggi le password vengono create solo in sviluppo.
- In staging/UAT/prod possono esistere utenti con `password = null`.
- Serve quindi una policy chiara su:
  - chi può avere una password;
  - come viene bootstrapata;
  - per quanto tempo resta valida.

### Rischi residui anche con env var server-side

Una env var server-side è necessaria, ma non sufficiente. È solo un interruttore operativo, non un controllo di sicurezza completo.

Deve essere accompagnata da:

- provisioning password sicuro;
- enforcement sul provider lato server;
- hardening anti-abuso;
- policy di revoca e rotazione;
- audit.

## Options Analysis

## Option A - Simple environment flag to enable credentials everywhere

### Description

Abilitare il provider `credentials` in ogni ambiente quando una env var è impostata, es. `AUTH_ENABLE_CREDENTIALS=true`.

### Pros

- implementazione minima;
- velocità di delivery;
- nessun cambio architetturale rilevante.

### Cons

- insicuro se riusa l'attuale gestione password;
- troppo facile dimenticare la feature attiva in produzione;
- non distingue casi d'uso legittimi:
  - staging/UAT;
  - support access;
  - break-glass;
  - full production rollout.

### Verdict

Non raccomandato come soluzione finale.

## Option B - Controlled credentials login with server-side flag and hardened password lifecycle

### Description

Abilitare il provider credentials solo se una env var server-side dedicata è attiva, ma aggiungere guardrail minimi obbligatori:

- password random per utente;
- reset obbligatorio al primo login;
- scadenza password temporanea;
- rate limiting;
- audit dei tentativi;
- invalidazione/revoca più stretta delle sessioni.

### Pros

- riusa l'architettura esistente;
- costo di implementazione medio;
- compatibile con staging e produzione;
- mantiene Google OAuth come primary path;
- consente un fallback controllato.

### Cons

- richiede una piccola estensione del modello utente o metadata auth;
- introduce complessità operativa su reset password e gestione credenziali;
- meno forte di soluzioni SSO-only o 2FA-enforced.

### Verdict

È l'opzione più efficiente e realistica per questo progetto.

## Option C - Break-glass credentials only for selected users

### Description

Abilitare le credenziali solo per utenti marcati esplicitamente, ad esempio:

- admin interni;
- account supporto;
- account demo;
- uno o pochi utenti per tenant.

Richiede due livelli:

- feature flag globale ambiente;
- allowlist o attributo utente.

### Pros

- superficie d'attacco molto ridotta;
- ottima per produzione se il vero bisogno è fallback e non uso generalizzato;
- semplice da governare.

### Cons

- non soddisfa un eventuale requisito di "tutti gli utenti devono poter usare password";
- richiede UI/processo admin per abilitazione puntuale.

### Verdict

Fortemente raccomandata come variante produzione della Option B.

## Option D - Credentials with mandatory second factor

### Description

Abilitare email/password online solo insieme a un secondo fattore:

- TOTP;
- magic link di conferma;
- OTP email.

### Pros

- sicurezza sensibilmente più alta;
- riduce impatto di password rubate o deboli.

### Cons

- costo implementativo maggiore;
- UX peggiore;
- non è la via più efficiente se il bisogno principale è fallback operativo.

### Verdict

Ottima evoluzione futura, non la prima iterazione più efficiente.

## Recommended Approach

## Recommendation

Adottare **Option B con policy di produzione derivata dalla Option C**.

In pratica:

- usare una env var server-side per abilitare il provider;
- usare una env var client-side separata solo per mostrare il form;
- in produzione non rendere il login password "globale" per tutti di default;
- abilitarlo solo per utenti o tenant esplicitamente autorizzati, almeno nella prima fase;
- mantenere Google OAuth come metodo primario.

### Why this is the best balance

È la soluzione più efficiente perché:

- sfrutta il provider credentials già presente;
- non richiede sostituire Auth.js né cambiare database;
- limita i cambi all'area auth e user lifecycle;
- evita di trasformare una feature di fallback in una password-auth general purpose poco governata.

Ed è la più sicura perché:

- la decisione non vive solo nel frontend;
- riduce la platea di account attaccabili;
- elimina password statiche/shared;
- può supportare revoca e audit coerenti.

## Proposed Functional Design

## Environment variables

Separare sempre controllo server e controllo UI.

### Mandatory server-side flags

- `AUTH_ENABLE_CREDENTIALS=false|true`
  - governa la registrazione del provider `credentials` lato server.
- `AUTH_ENABLE_CREDENTIALS_IN_UI=false|true`
  - governa solo la visibilità del form login.

### Optional safety flags

- `AUTH_CREDENTIALS_MODE=disabled|allowlisted|all`
  - `disabled`: provider off;
  - `allowlisted`: login password solo per utenti marcati;
  - `all`: login password consentito a tutti gli utenti aventi password valida.
- `AUTH_REQUIRE_PASSWORD_RESET_ON_FIRST_LOGIN=true`
- `AUTH_TEMP_PASSWORD_TTL_HOURS=24`

Nota: la UI non deve mai poter rendere disponibile il form se il provider server-side è disattivato.

## Authorization model for credentials

Per ogni tentativo credentials, lato server devono valere almeno questi check:

1. provider attivo via env var;
2. utente esistente;
3. utente `activated === true`;
4. `endDate` non scaduta;
5. utente autorizzato al login credentials secondo policy:
   - allowlisted user;
   - oppure tenant allowlist;
   - oppure modalità `all`;
6. password hash presente;
7. password non temporanea scaduta;
8. account non temporaneamente bloccato per troppi tentativi falliti.

## Password lifecycle

### Non accettabile

- password hardcoded condivise;
- fallback deboli;
- password temporanee senza scadenza;
- invio password in chiaro via email senza reset obbligatorio.

### Target policy

- password iniziale random, univoca per utente;
- hash `bcrypt` con costo coerente con lo standard del progetto;
- flag di reset obbligatorio al primo accesso;
- scadenza della password temporanea;
- possibilità di generare reset link invece di inviare la password in chiaro.

### Best practice recommendation

Per ambienti online, il canale preferibile non è "ti mando la password", ma:

1. admin crea utente;
2. sistema genera token di setup a scadenza breve;
3. utente imposta direttamente la propria password;
4. solo dopo l'impostazione la login credentials diventa attiva.

Questo riduce il rischio rispetto alla distribuzione di password temporanee via email.

## Session strategy

### Recommended change

Valutare seriamente il passaggio da `jwt` a `database` session strategy per gli ambienti dove le credenziali sono abilitate.

### Reason

Con login password online, serve una revoca più forte per casi come:

- utente disattivato;
- contratto terminato;
- password resettata;
- compromissione account;
- rimozione del diritto a usare credentials.

Se non si vuole cambiare subito la strategia sessione a livello globale, serve almeno un controllo server-side centrale e consistente sulle request autenticate, ma resta una soluzione inferiore.

## Abuse protection

Minimo indispensabile per esporre online il login credentials:

- rate limiting per IP;
- rate limiting per email/account;
- lockout temporaneo progressivo;
- logging dei fallimenti;
- audit event su:
  - login success;
  - login fail;
  - password reset requested;
  - password reset completed;
  - credentials enabled/disabled.

Opzionale ma consigliato:

- captcha/challenge dopo N tentativi falliti;
- alert per pattern anomali.

## Data Model Impact

L'implementazione sicura richiede verosimilmente nuovi attributi. I più utili sono:

- `User.canUseCredentialsLogin: Boolean`
- `User.mustResetPassword: Boolean`
- `User.passwordSetAt: DateTime?`
- `User.passwordExpiresAt: DateTime?`
- `User.failedLoginAttempts: Int`
- `User.lockedUntil: DateTime?`

Alternativa più pulita ma leggermente più costosa:

- estrarre questi campi in una tabella auth/profile dedicata.

Per efficienza, la prima iterazione può restare sul model `User`.

## Feature & Logic Map

| ID | Role | Feature | Functional Logic & Requirements | Edge Cases & Error Handling |
|:---|:---|:---|:---|:---|
| F01 | System | Provider gating | Il provider credentials deve essere registrato solo se la env var server-side è attiva. | Se il flag UI è acceso ma il provider server è spento, il form non deve essere mostrato oppure deve degradare con errore controllato. |
| F02 | Guest | Login form visibility | Il form email/password deve essere visibile solo se la env var client-side lo consente e il backend supporta davvero il provider. | Evitare mismatch SSR/client e tentativi verso provider non attivi. |
| F03 | Guest | Credentials authentication | Verifica email, password hash, stato account, scadenza contratto, policy credentials per utente/tenant. | Messaggi utente generici; logging tecnico dettagliato lato server. |
| F04 | Admin | Credentials entitlement | L'admin deve poter decidere se un utente può usare login password nei contesti online. | Default consigliato: `false` in produzione. |
| F05 | Admin/System | Password bootstrap | Niente password hardcoded. Setup tramite reset/set-password token oppure password random univoca con scadenza breve. | Token scaduto o già usato: richiedere rigenerazione. |
| F06 | User | First login password setup | Se credenziale temporanea o account nuovo, il sistema forza impostazione nuova password prima dell'uso pieno dell'app. | Token invalido, password non conforme, tentativi ripetuti. |
| F07 | System | Password policy | Minimo 12 caratteri, complessità, esclusione password banali, storico opzionale in fase successiva. | Rifiutare password che contengono email/nome o pattern deboli. |
| F08 | System | Abuse protection | Applicare rate limiting, lock temporaneo e audit. | Necessario gestire NAT/shared IP senza bloccare interi uffici in modo aggressivo. |
| F09 | Admin/System | Revocation | Disattivazione utente, reset password o revoca credentials devono ridurre al minimo la finestra di sessione residua. | Con JWT il rischio residuo è maggiore; con DB sessions è più gestibile. |
| F10 | Support/Admin | Break-glass access | Possibilità di abilitare temporaneamente credentials per casi operativi specifici. | Deve essere auditable e con scadenza esplicita. |

## Recommended Rollout Strategy

### Phase 1 - Staging/UAT safe enablement

- attivare credentials via env var solo in staging/UAT;
- eliminare password statiche;
- introdurre setup/reset password sicuro;
- introdurre rate limiting;
- introdurre audit tentativi.

### Phase 2 - Production allowlisted rollout

- abilitare `AUTH_CREDENTIALS_MODE=allowlisted`;
- consentire credentials solo a utenti selezionati;
- usarlo come fallback operativo e non come default universale;
- preferire account interni o amministrativi all'inizio.

### Phase 3 - Production broader rollout

Da valutare solo se serve davvero come prodotto:

- estensione a tutti gli utenti;
- eventuale 2FA;
- eventuale cambio definitivo a session strategy `database`.

## Technical Stack & Constraints

- **Auth framework:** Auth.js / NextAuth
- **Database:** Prisma + PostgreSQL
- **Password hashing:** bcryptjs
- **UI:** Next.js App Router

### Constraints

- non esiste oggi, nel codice analizzato, un lifecycle password production-grade completo;
- l'ambiente è multi-tenant e non deve consentire bypass di company boundaries;
- la soluzione deve essere governabile via env var, ma senza fare affidamento solo sulla env var per la sicurezza;
- il costo implementativo deve restare contenuto.

## Scope Boundaries

### In scope

- analisi di fattibilità;
- modello di sicurezza;
- opzioni architetturali;
- raccomandazione operativa;
- proposta di rollout.

### Out of scope

- implementazione codice;
- scelta concreta di libreria rate limiting;
- UX dettagliata di reset password;
- introduzione completa di 2FA.

## Final Recommendation

La variabile d'ambiente da sola **non è sufficiente** come misura di sicurezza.

La strada più efficiente e sicura per questo progetto è:

1. abilitare server-side il provider credentials con env var dedicata;
2. esporre il form solo quando anche il backend lo consente;
3. non riusare l'attuale modello di password statica/temporanea;
4. introdurre password setup/reset con token a scadenza;
5. aggiungere rate limiting e lockout;
6. in produzione partire con policy `allowlisted`, non con apertura globale;
7. valutare il passaggio a `database` sessions se il login password diventa un canale stabile.

In sintesi: **sì all'opzione gestita da env var, ma solo come interruttore operativo di una capability già hardenizzata**. La feature non dovrebbe essere implementata come semplice estensione del comportamento locale agli ambienti online.

## Open Questions

- Il bisogno in produzione è per tutti gli utenti o solo per account di supporto/demo/break-glass?
- È accettabile introdurre un flusso "set password" via link invece dell'invio di password temporanea?
- Si vuole mantenere `jwt` session strategy anche in presenza di credentials online, accettandone il trade-off?
- Esiste già a livello infrastrutturale un rate limiter/WAF riusabile?
