import "dotenv/config";
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';

async function main() {
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

// Create default roles
    let employeeRole = await prisma.role.findFirst({
        where: { 
            companyId: company.id,
            name: 'Employee'
        },
    });

    if (!employeeRole) {
        employeeRole = await prisma.role.create({
            data: {
                name: 'Employee',
                companyId: company.id,
                priorityWeight: 10,
            },
        });
    }

    let adminRole = await prisma.role.findFirst({
        where: { 
            companyId: company.id,
            name: 'Admin'
        },
    });

    if (!adminRole) {
        adminRole = await prisma.role.create({
            data: {
                name: 'Admin',
                companyId: company.id,
                priorityWeight: 100,
            },
        });
    }

    // Update company with default role
    await prisma.company.update({
        where: { id: company.id },
        data: { defaultRoleId: employeeRole.id }
    });

    console.log('Roles created and default role set.');

// Create default department
    let department = await prisma.department.findFirst({
        where: { 
            companyId: company.id,
            name: 'General'
        },
    });

    if (!department) {
        department = await prisma.department.create({
            data: {
                name: 'General',
                companyId: company.id,
                allowance: 25,
            },
        });
    }

    console.log('Department created:', department.id);

// Create default leave types
    const leaveTypes = [
        { name: 'Holiday', color: '#5cb85c', useAllowance: true },
        { name: 'Sick Leave', color: '#d9534f', useAllowance: false },
        { name: 'Other', color: '#f0ad4e', useAllowance: false },
    ];

    for (const lt of leaveTypes) {
        const existingType = await prisma.leaveType.findFirst({
            where: { 
                companyId: company.id,
                name: lt.name
            },
        });

        if (!existingType) {
            await prisma.leaveType.create({
                data: {
                    ...lt,
                    companyId: company.id,
                },
            });
        }
    }

console.log('Leave types created.');

    // Create admin user
    let adminUser = await prisma.user.findFirst({
        where: { 
            companyId: company.id,
            email: 'admin@example.com'
        },
    });

    if (!adminUser) {
        const defaultPassword = process.env.DEV_DEFAULT_PASSWORD || 'admin123';
        const hashedPassword = await bcrypt.hash(defaultPassword, 12);

        adminUser = await prisma.user.create({
            data: {
                email: 'admin@example.com',
                name: 'Admin',
                lastname: 'User',
                password: hashedPassword,
                isAdmin: true,
                activated: true,
                companyId: company.id,
                departmentId: department.id,
                defaultRoleId: adminRole.id,
            },
        });
    }

    console.log('Admin user created:', adminUser.id);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
