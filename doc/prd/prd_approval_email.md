## 1. Project Vision

The goal is to transform the current "passive" email notification into an operational tool. This will allow managers to approve or reject leave requests (PTO) directly from the email, reducing login friction and improving internal response times.

## 2. User Stories

- **As a Manager**, I want to approve a leave request with a quick action from the email to save time.
- **As a Manager**, I want to be able to reject a request by providing a mandatory reason without having to search for the request in the general dashboard.
- **As a System**, I want to ensure that actions are secure and that only the designated approver can perform the operation, even without an active browser session.

## 3. Functional Requirements

### 3.1 Email Template (New Layout)

The system must send emails using the HTML layout defined in Section 7. Dynamic data to be mapped includes:

- **User:** `User.name` + `User.lastname`.
- **Start Date / End Date:** `LeaveRequest.dateStart` / `LeaveRequest.dateEnd`.
- **Leave Type:** `LeaveType.name`.
- **Duration (Dynamic):** The duration must be calculated and formatted starting from `LeaveRequest.durationMinutes`.
    - If `durationMinutes` == `Company.minutesPerDay`, show "1 Day" (or "Full Day").
    - If `durationMinutes` > `Company.minutesPerDay`, calculate total days (e.g., "3 Days").
    - If the duration is less than a full day, show hours and minutes (e.g., "4h 30m") or the corresponding fraction (`DayPart`).
- **User Notes:** `LeaveRequest.employeeComment`.

### 3.2 CTA: "Approve" (Quick Action)

- **Behavior:** Clicking the button in the email leads to a secure landing page ("Quick Approval Page").
- **Access Requirement:** No login required (via Token).
- **Execution Logic:**
    1. User lands on the page (Token validated).
    2. To prevent bot/scanners from auto-approving, the user must click a central confirmation button ("Approve Now").
    3. On click: Update `LeaveRequest` (`status = APPROVED`, `decidedAt = now()`, `approverId = managerId`).
    4. Register in `Audit` log with the comment "Action via Email".
- **Feedback UI:** Success message with a summary of the processed request.

### 3.3 CTA: "Reject" (Standalone Form)

- **Behavior:** Clicking the button leads to a dedicated page in the Redify portal (`/requests/[id]/reject?token=...`).
- **Access Requirement:** No login required (via Token).
- **UI:**
    - Request data summary (including exact duration in minutes/hours).
    - Mandatory textarea for `approverComment`.
    - "Confirm Rejection" button.
- **Execution Logic:**
    1. Update `LeaveRequest`: `status = REJECTED`, `approverComment = input`, `decidedAt = now()`.
- **Feedback UI:** Redirect to a confirmation page.

## 4. Technical Specifications

### 4.1 Security: Action Tokens

- **Generation:** Unique token linked to `LeaveRequest.id` and `approverId`.
- **Expiry:** 7 days or single-use (invalidated after the first successful action).
- **Payload:** Must contain the request ID and the expected approver ID.

### 4.2 New Next.js Routes

1. **`GET /actions/approve/[token]`**: Landing page for approval with a confirmation button.
2. **`POST /api/approve`**: API endpoint (or Server Action) to process the update after manual confirmation.
3. **`GET /actions/reject/[token]`**: Page with Shadcn UI form (Textarea + Button).

### 4.3 Prisma Integration

Operations must reflect the updated models:

- **LeaveRequest:** Update `status`, `approverId`, `approverComment`, `decidedAt`.
- **Audit:** Create record (e.g., `entityType: "LeaveRequest"`, `attribute: "status"`, `newValue: "APPROVED"`, `comment: "Action via Email"`, `byUserId: managerId`).

## 5. Edge Cases & Error Handling

- **Expired Token:** Show an error message with a link to manual login.
- **Request Already Processed:** If `status` is no longer `NEW`, show: "This request was already processed on `decidedAt`".
- **Email Scanners:** Crucial: the `GET` route must never modify the database. The update action must be triggered exclusively by a `POST` or Server Action linked to the confirmation button on the landing page.

## 6. UI/UX (Tailwind 4 + Shadcn)

- **Mobile First:** Optimized for smartphones (easy-to-tap buttons).
- **Components:** `Textarea` and `Button` from Shadcn UI.
- **Visual Feedback:** Use Lucide icons (Check for success, X for rejection).

## 7. Email Template (HTML Reference)
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "[http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd](http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd)">
<html xmlns="[http://www.w3.org/1999/xhtml](http://www.w3.org/1999/xhtml)">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<title>Request for Approval - Redify</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<style type="text/css">
    body { width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f2f4f6; color: #111518; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 4px; overflow: hidden; }
    .header { padding: 40px 48px 30px 48px; text-align: center; }
    .logo { font-size: 28px; font-weight: bold; font-style: italic; letter-spacing: -0.5px; margin-bottom: 30px; }
    .icon-circle { width: 40px; height: 40px; background-color: #f39c12; border-radius: 50%; display: inline-block; text-align: center; line-height: 40px; color: white; font-size: 20px; font-weight: bold; margin-right: 20px; vertical-align: top; }
    .status-title { font-size: 22px; font-weight: bold; margin: 0; padding: 0; line-height: 1.2; text-align: left; }
    .status-msg { color: #6b7c89; font-size: 15px; margin: 5px 0 0 0; line-height: 1.4; text-align: left; }
    .content-area { padding: 30px 48px; border-top: 1px solid #e5e7eb; }
    .details-label { color: #9aaebc; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 5px; }
    .details-value { font-size: 16px; font-weight: bold; padding-bottom: 25px; }
    .user-link { color: #111518; text-decoration: none; }
    .footer-action { background-color: #f8f9fa; padding: 40px 30px; text-align: center; border-top: 1px solid #e5e7eb; }
    .btn { display: inline-block; padding: 12px 30px; border-radius: 6px; font-weight: bold; font-size: 14px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 8px; width: 120px; }
    .btn-approve { background-color: #5cb85c; color: #ffffff; }
    .btn-reject { background-color: #d9534f; color: #ffffff; }
    .system-footer { text-align: center; padding: 30px; color: #9aaebc; font-size: 12px; }
</style>
</head>
<body>
<div class="container">
    <div class="header">
        <div class="logo">Redify</div>
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
                <td width="60" valign="top">
                    <div class="icon-circle">!</div>
                </td>
                <td valign="top">
                    <p class="status-title">Request for Approval</p>
                    <p class="status-msg">A new leave request was submitted and requires your attention. Please review.</p>
                </td>
            </tr>
        </table>
    </div>

    <div class="content-area">
        <div class="details-label">User</div>
        <div class="details-value"><a href="#" class="user-link">{{userName}}</a></div>

        <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
                <td width="50%">
                    <div class="details-label">Start Date</div>
                    <div class="details-value">{{startDate}}</div>
                </td>
                <td width="50%">
                    <div class="details-label">End Date</div>
                    <div class="details-value">{{endDate}}</div>
                </td>
            </tr>
            <tr>
                <td>
                    <div class="details-label">Leave Type</div>
                    <div class="details-value">{{leaveType}}</div>
                </td>
                <td>
                    <div class="details-label">Duration</div>
                    <div class="details-value">{{duration}}</div>
                </td>
            </tr>
        </table>

        <div style="border-top: 1px solid #f0f2f4; margin: 10px 0 25px 0;"></div>

        <div class="details-label">User Notes</div>
        <div class="details-value" style="font-weight: normal; font-style: italic;">"{{userNotes}}"</div>
    </div>

    <div class="footer-action">
        <a href="{{approveUrl}}" class="btn btn-approve">Approve</a>
        <a href="{{rejectUrl}}" class="btn btn-reject">Reject</a>
    </div>
</div>
<div class="system-footer">
    Redify PTO System - Automated Notification
</div>
</body>
</html>