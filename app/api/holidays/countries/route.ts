import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-helper';

/**
 * GET /api/holidays/countries
 * Returns list of countries used in the system (company country + all user countries)
 */
export async function GET(req: NextRequest) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) return ApiErrors.unauthorized();

        const user = await prisma.user.findUnique({
            where: { clerkId },
            select: { companyId: true }
        });

        if (!user || !user.companyId) return ApiErrors.unauthorized();

        // Get company country
        const company = await prisma.company.findUnique({
            where: { id: user.companyId },
            select: { country: true }
        });

        // Get all unique user countries
        const users = await prisma.user.findMany({
            where: {
                companyId: user.companyId,
                country: { not: null }
            },
            select: { country: true },
            distinct: ['country']
        });

        // Combine and deduplicate
        const countries = new Set<string>();
        if (company?.country) {
            countries.add(company.country);
        }
        users.forEach(u => {
            if (u.country) countries.add(u.country);
        });

        return successResponse(Array.from(countries).sort());
    } catch (error) {
        console.error('Error fetching countries:', error);
        return ApiErrors.internalError();
    }
}
