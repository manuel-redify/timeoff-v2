import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { format, addDays } from 'date-fns';
import { LeaveStatus } from '@/lib/generated/prisma/enums';

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
                        status: 'APPROVED' as any, // Only approved requests in iCal
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

            // UID must be unique and persistent
            const uid = `${req.id}@timeoff-v2.app`;
            const dtstamp = format(updated, "yyyyMMdd'T'HHmmss'Z'");

            if (req.dayPartStart === 'all' && req.dayPartEnd === 'all') {
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
                // For now, mapping to morning/afternoon slots
                const morningStart = "090000";
                const morningEnd = "130000";
                const afternoonStart = "130000";
                const afternoonEnd = "170000";

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
