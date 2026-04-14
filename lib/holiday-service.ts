import prisma from '@/lib/prisma';
import { getYear } from 'date-fns';

// Static list of holidays for demo purposes
// In production, this would use an external API like Nager.Date or similar
const HOLIDAYS: Record<string, { date: string, name: string }[]> = {
    'GB': [
        { date: '2026-01-01', name: 'New Year\'s Day' },
        { date: '2026-04-03', name: 'Good Friday' },
        { date: '2026-04-06', name: 'Easter Monday' },
        { date: '2026-05-04', name: 'Early May Bank Holiday' },
        { date: '2026-05-25', name: 'Spring Bank Holiday' },
        { date: '2026-08-31', name: 'Summer Bank Holiday' },
        { date: '2026-12-25', name: 'Christmas Day' },
        { date: '2026-12-26', name: 'Boxing Day' },
    ],
    'US': [
        { date: '2026-01-01', name: 'New Year\'s Day' },
        { date: '2026-01-19', name: 'Martin Luther King Jr. Day' },
        { date: '2026-02-16', name: 'Presidents\' Day' },
        { date: '2026-05-25', name: 'Memorial Day' },
        { date: '2026-06-19', name: 'Juneteenth' },
        { date: '2026-07-04', name: 'Independence Day' },
        { date: '2026-09-07', name: 'Labor Day' },
        { date: '2026-10-12', name: 'Columbus Day' },
        { date: '2026-11-11', name: 'Veterans Day' },
        { date: '2026-11-26', name: 'Thanksgiving Day' },
        { date: '2026-12-25', name: 'Christmas Day' },
    ],
    'IT': [
        { date: '2026-01-01', name: 'Capodanno' },
        { date: '2026-01-06', name: 'Epifania' },
        { date: '2026-04-05', name: 'Pasqua' },
        { date: '2026-04-06', name: 'Lunedì dell\'Angelo' },
        { date: '2026-04-25', name: 'Festa della Liberazione' },
        { date: '2026-05-01', name: 'Festa del Lavoro' },
        { date: '2026-06-02', name: 'Festa della Repubblica' },
        { date: '2026-08-15', name: 'Assunzione (Ferragosto)' },
        { date: '2026-11-01', name: 'Ognissanti' },
        { date: '2026-12-08', name: 'Immacolata Concezione' },
        { date: '2026-12-25', name: 'Natale' },
        { date: '2026-12-26', name: 'Santo Stefano' },
    ]
};

export async function importHolidays(companyId: string, country: string, year?: number) {
    const list = HOLIDAYS[country.toUpperCase()];
    if (!list) return 0;

    let count = 0;
    const targetYear = year || getYear(new Date());

    for (const h of list) {
        // If the mocked holiday is fixed in 2026, we replace the year with the target year for dynamic imports.
        // In reality, dates can change so an API is better.
        const parsedDate = new Date(h.date);
        parsedDate.setFullYear(targetYear);

        // Check if exists for this company, country and date
        const exists = await prisma.bankHoliday.findFirst({
            where: {
                companyId,
                country: country.toUpperCase(),
                date: parsedDate
            }
        });

        if (!exists) {
            await prisma.bankHoliday.create({
                data: {
                    companyId,
                    name: h.name,
                    date: parsedDate,
                    country: country.toUpperCase(),
                    year: targetYear,
                    status: 'pending'
                }
            });
            count++;
        }
    }
    return count;
}

export async function getHolidays(companyId: string, country: string, year: number) {
    return prisma.bankHoliday.findMany({
        where: {
            companyId,
            country: country.toUpperCase(),
            year,
            deletedAt: null
        },
        orderBy: {
            date: 'asc'
        }
    });
}

export async function getActiveCountries(companyId: string, year: number): Promise<string[]> {
    const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { country: true }
    });

    const activeUsers = await prisma.user.findMany({
        where: {
            companyId,
            activated: true,
            deletedAt: null,
            country: { not: null }
        },
        select: { country: true },
        distinct: ['country']
    });

    const countries = new Set<string>();
    if (company?.country) countries.add(company.country.toUpperCase());
    
    for (const u of activeUsers) {
        if (u.country) countries.add(u.country.toUpperCase());
    }

    return Array.from(countries);
}
