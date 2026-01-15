import "dotenv/config";
import { PrismaClient } from '@prisma/client';
async function main() {
    const prisma = new PrismaClient();
    console.log('Seeding initial company...');
    let company = await prisma.company.findFirst({
        where: { name: 'Default Company' },
    });
    if (!company) {
        company = await prisma.company.create({
            data: {
                name: 'Default Company',
                country: 'UK',
                timezone: 'Europe/London',
                dateFormat: 'YYYY-MM-DD',
                startOfNewYear: 1,
                shareAllAbsences: false,
                isTeamViewHidden: false,
                ldapAuthEnabled: false,
                carryOver: 0,
                mode: 1,
            },
        });
    }
    console.log('Company created:', company.id);
    // Create default department
    const department = await prisma.department.create({
        data: {
            name: 'General',
            companyId: company.id,
            allowance: 25,
        },
    });
    console.log('Department created:', department.id);
    // Create default leave types
    const leaveTypes = [
        { name: 'Holiday', color: '#5cb85c', useAllowance: true },
        { name: 'Sick Leave', color: '#d9534f', useAllowance: false },
        { name: 'Other', color: '#f0ad4e', useAllowance: false },
    ];
    for (const lt of leaveTypes) {
        await prisma.leaveType.create({
            data: {
                ...lt,
                companyId: company.id,
            },
        });
    }
    console.log('Leave types created.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
});
