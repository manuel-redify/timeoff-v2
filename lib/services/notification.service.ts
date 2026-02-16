import prisma from '@/lib/prisma';
import { smtp2go } from '@/lib/smtp2go';
import { emailConfig } from '@/lib/email-config';
import { render } from '@react-email/render';
import React from 'react';
import LeaveRequestSubmittedEmail from '@/emails/LeaveRequestSubmitted';
import LeaveRequestDecisionEmail from '@/emails/LeaveRequestDecision';
import SystemWelcomeEmail from '@/emails/SystemWelcome';

export type NotificationType =
    | 'LEAVE_SUBMITTED'
    | 'LEAVE_APPROVED'
    | 'LEAVE_REJECTED'
    | 'WELCOME';

interface NotificationData {
    requesterName?: string;
    approverName?: string;
    leaveType?: string;
    startDate?: string;
    endDate?: string;
    actionUrl?: string;
    userName?: string;
    loginUrl?: string;
    comment?: string;
}

export class NotificationService {
    static async notify(
        userId: string,
        type: NotificationType,
        data: NotificationData,
        companyId?: string
    ) {
        console.log(`[NOTIFICATION_SERVICE] Starting notification for userId: ${userId}, type: ${type}, data:`, data);
        
        // 1. Fetch user preferences
        const preference = await prisma.notificationPreference.findUnique({
            where: {
                userId_type: {
                    userId,
                    type,
                },
            },
        });

        const channel = preference?.channel || 'BOTH';
        console.log(`[NOTIFICATION_SERVICE] User ${userId} notification channel for ${type}: ${channel}`);

        if (channel === 'NONE') {
            console.log(`[NOTIFICATION_SERVICE] User ${userId} has disabled ${type} notifications`);
            return;
        }

        // 2. Prepare content/meta
        let title = '';
        let message = '';
        const link = data.actionUrl ?? data.loginUrl ?? undefined;

        switch (type) {
            case 'LEAVE_SUBMITTED':
                title = 'New Leave Request';
                message = `${data.requesterName} submitted a ${data.leaveType} request.`;
                break;
            case 'LEAVE_APPROVED':
                title = 'Leave Request Approved';
                message = `Your ${data.leaveType} request for ${data.startDate} has been approved.`;
                break;
            case 'LEAVE_REJECTED':
                title = 'Leave Request Rejected';
                if (data.approverName) {
                    // Watcher notification - includes requester name and approver info
                    message = `${data.requesterName}'s ${data.leaveType} request for ${data.startDate} was rejected by ${data.approverName}.${data.comment ? ` Reason: ${data.comment}` : ''}`;
                } else {
                    // Requester notification - original message
                    message = `Your ${data.leaveType} request for ${data.startDate} has been rejected.`;
                }
                break;
            case 'WELCOME':
                title = 'Welcome to TimeOff';
                message = `Hi ${data.userName}, welcome to your new account!`;
                break;
        }

// 3. Dispatch In-App Notification
        if (channel === 'BOTH' || channel === 'IN_APP') {
            try {
                const notification = await prisma.notification.create({
                    data: {
                        userId,
                        type,
                        title,
                        message,
                        link: link ?? null,
                    },
                });
                console.log(`[NOTIFICATION_SERVICE] Created in-app notification ${notification.id} for user ${userId}`);
            } catch (err) {
                console.error('[NOTIFICATION_SERVICE] Failed to create in-app notification:', err);
            }
        } else {
            console.log(`[NOTIFICATION_SERVICE] Skipping in-app notification for user ${userId} (channel: ${channel})`);
        }

        // 4. Dispatch Email Notification
        if ((channel === 'BOTH' || channel === 'EMAIL') && smtp2go) {
            try {
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { email: true, name: true, lastname: true, companyId: true },
                });

                if (user?.email) {
                    let emailHtml = '';
                    const subject = title;

                    switch (type) {
                        case 'LEAVE_SUBMITTED':
                            emailHtml = await render(
                        React.createElement(LeaveRequestSubmittedEmail, {
                            requesterName: data.requesterName!,
                            leaveType: data.leaveType!,
                            startDate: data.startDate!,
                            endDate: data.endDate!,
                            actionUrl: data.actionUrl,
                        })
                            );
                            break;
                        case 'LEAVE_APPROVED':
                        case 'LEAVE_REJECTED':
                            emailHtml = await render(
                        React.createElement(LeaveRequestDecisionEmail, {
                            status: type === 'LEAVE_APPROVED' ? 'APPROVED' : 'REJECTED',
                            approverName: data.approverName!,
                            leaveType: data.leaveType!,
                            startDate: data.startDate!,
                            endDate: data.endDate!,
                            comment: data.comment,
                            actionUrl: data.actionUrl,
                            requesterName: data.requesterName,
                        })
                            );
                            break;
                        case 'WELCOME':
                            emailHtml = await render(
                                React.createElement(SystemWelcomeEmail, {
                                    userName: data.userName!,
                                    loginUrl: data.loginUrl!,
                                })
                            );
                            break;
                    }

if (emailHtml) {
                        console.log(`[NOTIFICATION_SERVICE] Sending email to ${user.email} for ${type}`);
                        const mailService = smtp2go.mail()
                            .to({ email: user.email })
                            .from({ email: emailConfig.sender.email, name: emailConfig.sender.name })
                            .subject(subject)
                            .html(emailHtml);

                        const { data: smtp2goData, error } = await smtp2go.client().consume(mailService);

                        if (error) {
                            console.error('[NOTIFICATION_SERVICE] SMTP2GO error:', error);
                        } else {
                            console.log(`[NOTIFICATION_SERVICE] Email sent successfully to ${user.email}, SMTP2GO ID: ${smtp2goData?.data?.email_id}`);
                            // 5. Audit Log
                            await prisma.emailAudit.create({
                                data: {
                                    email: user.email,
                                    subject,
                                    body: emailHtml,
                                    userId,
                                    companyId: companyId || user.companyId,
                                },
                            });
                            console.log(`[NOTIFICATION_SERVICE] Email audit log created for ${user.email}`);
                        }
                    }
                }
            } catch (err) {
                console.error('[NOTIFICATION_SERVICE] Failed to send email notification:', err);
            }
        } else {
            console.log(`[NOTIFICATION_SERVICE] Skipping email notification for user ${userId} (channel: ${channel})`);
        }
    }
}
