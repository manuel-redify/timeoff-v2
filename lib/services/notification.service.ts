import prisma from '@/lib/prisma';
import { resend } from '@/lib/resend';
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

        if (channel === 'NONE') return;

        // 2. Prepare content/meta
        let title = '';
        let message = '';
        let link = data.actionUrl || data.loginUrl || '';

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
                message = `Your ${data.leaveType} request for ${data.startDate} has been rejected.`;
                break;
            case 'WELCOME':
                title = 'Welcome to TimeOff';
                message = `Hi ${data.userName}, welcome to your new account!`;
                break;
        }

        // 3. Dispatch In-App Notification
        if (channel === 'BOTH' || channel === 'IN_APP') {
            try {
                await prisma.notification.create({
                    data: {
                        userId,
                        type,
                        title,
                        message,
                        link,
                    },
                });
            } catch (err) {
                console.error('Failed to create in-app notification:', err);
            }
        }

        // 4. Dispatch Email Notification
        if ((channel === 'BOTH' || channel === 'EMAIL') && resend) {
            try {
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { email: true, name: true, lastname: true, companyId: true },
                });

                if (user?.email) {
                    let emailHtml = '';
                    let subject = title;

                    switch (type) {
                        case 'LEAVE_SUBMITTED':
                            emailHtml = await render(
                                React.createElement(LeaveRequestSubmittedEmail, {
                                    requesterName: data.requesterName!,
                                    leaveType: data.leaveType!,
                                    startDate: data.startDate!,
                                    endDate: data.endDate!,
                                    actionUrl: data.actionUrl!,
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
                                    actionUrl: data.actionUrl!,
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
                        const { data: resendData, error } = await resend.emails.send({
                            from: 'TimeOff Management <onboarding@resend.dev>',
                            to: user.email,
                            subject,
                            html: emailHtml,
                        });

                        if (error) {
                            console.error('Resend error:', error);
                        } else {
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
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to send email notification:', err);
            }
        }
    }
}
