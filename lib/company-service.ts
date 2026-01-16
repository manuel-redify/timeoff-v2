import prisma from '@/lib/prisma';
import { importHolidays } from './holiday-service';

export class CompanyService {

    /**
     * Initializes default settings for a newly created company.
     * 1. Creates a default 'General' department.
     * 2. Creates a default Mon-Fri schedule.
     * 3. Imports holidays if country is supported.
     */
    static async initializeCompany(companyId: string, countryCode?: string) {

        // 1. Default Department
        const existingDept = await prisma.department.findFirst({ where: { companyId } });
        if (!existingDept) {
            await prisma.department.create({
                data: {
                    companyId,
                    name: 'General',
                    includePublicHolidays: true,
                    isAccruedAllowance: false
                }
            });
        }

        // 2. Default Schedule
        const existingSchedule = await prisma.schedule.findFirst({ where: { companyId, userId: null } });
        if (!existingSchedule) {
            await prisma.schedule.create({
                data: {
                    companyId,
                    userId: null,
                    monday: 1,
                    tuesday: 1,
                    wednesday: 1,
                    thursday: 1,
                    friday: 1,
                    saturday: 2,
                    sunday: 2
                }
            });
        }

        // 3. Import Holidays
        if (countryCode) {
            await importHolidays(companyId, countryCode);
        }
    }
}
