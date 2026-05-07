import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { format, addDays } from 'date-fns';
import { getCompanyWorkdaySettings } from '@/lib/company-workday-settings';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;

        if (!token) {
            return new Response('Token missing', { status: 400 });
        }

        const user = await prisma.user.findFirst({
            where: {
                icalFeedToken: token,
                deletedAt: null
            },
            include: {
                company: true,
                leaveRequests: {
                    where: {
                        deletedAt: null,
                        status: 'APPROVED' as any,
                    },
                    include: {
                        leaveType: true
                    }
                }
            }
        });

        if (!user) {
            return new Response('Invalid token', { status: 404 });
        }

        const workdaySettings = await getCompanyWorkdaySettings(
            user.companyId,
            user.company.minutesPerDay
        );
        const toIcalTime = (minutes: number) => {
            const hours = Math.floor(minutes / 60).toString().padStart(2, '0');
            const mins = (minutes % 60).toString().padStart(2, '0');
            return `${hours}${mins}00`;
        };

        // iCal generation
        const calendarName = `${user.name}'s TimeOff`;
        let icalContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//TimeOff Management//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            `X-WR-CALNAME:${calendarName}`,
            `X-WR-TIMEZONE:${user.company.timezone}`,
            'X-WR-CALDESC:Leave requests from TimeOff V2',
        ];

        for (const req of user.leaveRequests) {
            const start = req.dateStart;
            const end = req.dateEnd;
            const updated = req.updatedAt;
            const hasExplicitCustomRange =
                req.customStartMinutes !== null &&
                req.customEndMinutes !== null &&
                req.customEndMinutes > req.customStartMinutes &&
                format(start, "yyyyMMdd") === format(end, "yyyyMMdd");

            // UID must be unique and persistent
            const uid = `${req.id}@timeoff-v2.app`;
            const dtstamp = format(updated, "yyyyMMdd'T'HHmmss'Z'");

            if (hasExplicitCustomRange) {
                const dtstart = `${format(start, "yyyyMMdd")}T${toIcalTime(req.customStartMinutes!)}`;
                const dtend = `${format(end, "yyyyMMdd")}T${toIcalTime(req.customEndMinutes!)}`;

                icalContent.push('BEGIN:VEVENT');
                icalContent.push(`UID:${uid}`);
                icalContent.push(`DTSTAMP:${dtstamp}`);
                icalContent.push(`DTSTART:${dtstart}`);
                icalContent.push(`DTEND:${dtend}`);
                icalContent.push(`SUMMARY:${req.leaveType.name} - ${user.name} ${user.lastname}`);
                if (req.employeeComment) {
                    icalContent.push(`DESCRIPTION:${req.employeeComment}`);
                }
                icalContent.push('STATUS:CONFIRMED');
                icalContent.push('TRANSP:OPAQUE');
                icalContent.push('END:VEVENT');
            } else if (req.dayPartStart === 'all' && req.dayPartEnd === 'all') {
                // All-day event
                // RFC 5545: DTEND is exclusive
                const dtstart = format(start, "yyyyMMdd");
                const dtend = format(addDays(end, 1), "yyyyMMdd");

                icalContent.push('BEGIN:VEVENT');
                icalContent.push(`UID:${uid}`);
                icalContent.push(`DTSTAMP:${dtstamp}`);
                icalContent.push(`DTSTART;VALUE=DATE:${dtstart}`);
                icalContent.push(`DTEND;VALUE=DATE:${dtend}`);
                icalContent.push(`SUMMARY:${req.leaveType.name} - ${user.name} ${user.lastname}`);
                if (req.employeeComment) {
                    icalContent.push(`DESCRIPTION:${req.employeeComment}`);
                }
                icalContent.push('STATUS:CONFIRMED');
                icalContent.push('TRANSP:OPAQUE');
                icalContent.push('END:VEVENT');
            } else {
                // Half-day or partial
                const morningStart = toIcalTime(workdaySettings.workdayStartMinutes);
                const morningEnd = toIcalTime(workdaySettings.morningEndMinutes);
                const afternoonStart = toIcalTime(workdaySettings.afternoonStartMinutes);
                const afternoonEnd = toIcalTime(workdaySettings.workdayEndMinutes);

                let dtstart_time = morningStart;
                let dtend_time = morningEnd;

                if (req.dayPartStart === 'morning') {
                    dtstart_time = morningStart;
                    dtend_time = morningEnd;
                } else if (req.dayPartStart === 'afternoon') {
                    dtstart_time = afternoonStart;
                    dtend_time = afternoonEnd;
                }

                const dtstart = `${format(start, "yyyyMMdd")}T${dtstart_time}`;
                const dtend = `${format(end, "yyyyMMdd")}T${dtend_time}`;

                icalContent.push('BEGIN:VEVENT');
                icalContent.push(`UID:${uid}`);
                icalContent.push(`DTSTAMP:${dtstamp}`);
                icalContent.push(`DTSTART:${dtstart}`);
                icalContent.push(`DTEND:${dtend}`);
                icalContent.push(`SUMMARY:${req.leaveType.name} (${req.dayPartStart}) - ${user.name} ${user.lastname}`);
                if (req.employeeComment) {
                    icalContent.push(`DESCRIPTION:${req.employeeComment}`);
                }
                icalContent.push('STATUS:CONFIRMED');
                icalContent.push('TRANSP:OPAQUE');
                icalContent.push('END:VEVENT');
            }
        }

        icalContent.push('END:VCALENDAR');

        return new Response(icalContent.join('\r\n'), {
            headers: {
                'Content-Type': 'text/calendar',
                'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=600',
                'Content-Disposition': `attachment; filename="${user.lastname}_timeoff.ics"`
            }
        });

    } catch (error) {
        console.error('Error generating iCal feed:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}
