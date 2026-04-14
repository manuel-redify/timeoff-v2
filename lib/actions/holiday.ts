"use server";

import { auth } from "@/auth";
import { importHolidaysForActiveCountries } from "@/lib/holiday-service";
import prisma from "@/lib/prisma";

export async function triggerHolidaysImport(year: number) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" };
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true, isAdmin: true }
        });

        if (!user || !user.companyId || !user.isAdmin) {
            return { success: false, error: "Unauthorized or not an admin" };
        }

        const importedCount = await importHolidaysForActiveCountries(user.companyId, year);
        return { success: true, count: importedCount };
    } catch (error) {
        console.error('Error in triggerHolidaysImport:', error);
        return { success: false, error: "Failed to trigger holiday imports" };
    }
}

export async function validateHolidays(country: string, year: number) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" };
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true, isAdmin: true }
        });

        if (!user || !user.companyId || !user.isAdmin) {
            return { success: false, error: "Unauthorized or not an admin" };
        }

        const result = await prisma.bankHoliday.updateMany({
            where: {
                companyId: user.companyId,
                country: country.toUpperCase(),
                year,
                status: 'pending'
            },
            data: {
                status: 'validated'
            }
        });

        return { success: true, count: result.count };
    } catch (error) {
        console.error('Error in validateHolidays:', error);
        return { success: false, error: "Failed to validate holidays" };
    }
}
