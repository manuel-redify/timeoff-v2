import { cache } from 'react';
import prisma from '@/lib/prisma';
import { DayPart } from '@/lib/generated/prisma/enums';
import { LeaveCalculationService } from '@/lib/leave-calculation-service';
import { AllowanceService } from '@/lib/allowance-service';
import { startOfYear, endOfYear } from 'date-fns';
import type { LeaveRequest, LeaveType, ApprovalStep } from '@/lib/generated/prisma/client';

export type LeaveRequestWithRelations = LeaveRequest & {
  leaveType: LeaveType;
  approvalSteps: ApprovalStep[];
};

export interface DashboardKpis {
  leavesTakenYTD: number;
  pendingRequests: number;
  upcomingCount: number;
}

export interface UserAllowanceInfo {
  totalAllowance: number;
  usedAllowance: number;
  pendingAllowance: number;
  availableAllowance: number;
}

export interface LeaveRequestWithDuration {
  id: string;
  leaveType: { id: string; name: string; color: string };
  dateStart: Date;
  dateEnd: Date;
  dayPartStart: DayPart;
  dayPartEnd: DayPart;
  status: string;
  createdAt: Date;
  duration: number;
}

const leaveRequestInclude = {
  leaveType: true,
  approvalSteps: {
    orderBy: { sequenceOrder: 'asc' as const },
  },
} as const;

export class LeaveRequestService {
  static getLeaveRequests = cache(
    async (userId: string, year: number): Promise<LeaveRequestWithRelations[]> => {
      const yearStart = startOfYear(new Date(year, 0, 1));
      const yearEnd = endOfYear(new Date(year, 0, 1));

      return prisma.leaveRequest.findMany({
        where: {
          userId,
          deletedAt: null,
          dateStart: { lte: yearEnd },
          dateEnd: { gte: yearStart },
        },
        include: leaveRequestInclude,
        orderBy: { dateStart: 'desc' },
      });
    }
  );

  static getNextLeave = cache(
    async (userId: string): Promise<LeaveRequestWithRelations | null> => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return prisma.leaveRequest.findFirst({
        where: {
          userId,
          deletedAt: null,
          dateEnd: { gte: today },
          status: { in: ['APPROVED', 'NEW'] },
        },
        include: leaveRequestInclude,
        orderBy: { dateStart: 'asc' },
      });
    }
  );

  static async getLeavesTakenYTD(userId: string): Promise<number> {
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31);

    const approved = await prisma.leaveRequest.findMany({
      where: {
        userId,
        deletedAt: null,
        status: 'APPROVED',
        dateStart: { lte: yearEnd },
        dateEnd: { gte: yearStart },
        leaveType: { useAllowance: true },
      },
    });

    let total = 0;
    for (const leave of approved) {
      total += await LeaveCalculationService.calculateLeaveDays(
        userId,
        leave.dateStart,
        leave.dayPartStart,
        leave.dateEnd,
        leave.dayPartEnd,
      );
    }

    return total;
  }

  static getPendingRequests = cache(
    async (userId: string): Promise<number> => {
      return prisma.leaveRequest.count({
        where: {
          userId,
          deletedAt: null,
          status: { in: ['NEW', 'PENDING_REVOKE'] },
        },
      });
    }
  );

  static getUpcomingCount = cache(
    async (userId: string): Promise<number> => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return prisma.leaveRequest.count({
        where: {
          userId,
          deletedAt: null,
          status: 'APPROVED',
          dateStart: { gt: today },
        },
      });
    }
  );

  static async getUserAllowance(userId: string, year?: number): Promise<UserAllowanceInfo> {
    const targetYear = year ?? new Date().getFullYear();
    const breakdown = await AllowanceService.getAllowanceBreakdown(userId, targetYear);

    return {
      totalAllowance: breakdown.totalAllowance,
      usedAllowance: breakdown.usedAllowance,
      pendingAllowance: breakdown.pendingAllowance,
      availableAllowance: breakdown.availableAllowance,
    };
  }

  static async getDashboardKpis(userId: string): Promise<DashboardKpis> {
    const [leavesTakenYTD, pendingRequests, upcomingCount] = await Promise.all([
      this.getLeavesTakenYTD(userId),
      this.getPendingRequests(userId),
      this.getUpcomingCount(userId),
    ]);

    return { leavesTakenYTD, pendingRequests, upcomingCount };
  }

  static async getLeaveRequestsWithDuration(userId: string, year?: number | null): Promise<LeaveRequestWithDuration[]> {
    const whereClause: any = {
      userId,
      deletedAt: null,
    };

    if (year) {
      const yearStart = startOfYear(new Date(year, 0, 1));
      const yearEnd = endOfYear(new Date(year, 0, 1));
      whereClause.dateStart = { lte: yearEnd };
      whereClause.dateEnd = { gte: yearStart };
    }

    const requests = await prisma.leaveRequest.findMany({
      where: whereClause,
      include: { leaveType: true },
      orderBy: { createdAt: 'desc' },
    });

    const requestsWithDuration = await Promise.all(
      requests.map(async (req) => ({
        id: req.id,
        leaveType: {
          id: req.leaveType.id,
          name: req.leaveType.name,
          color: req.leaveType.color,
        },
        dateStart: req.dateStart,
        dateEnd: req.dateEnd,
        dayPartStart: req.dayPartStart,
        dayPartEnd: req.dayPartEnd,
        status: req.status,
        createdAt: req.createdAt,
        duration: await LeaveCalculationService.calculateLeaveDays(
          userId,
          req.dateStart,
          req.dayPartStart,
          req.dateEnd,
          req.dayPartEnd
        ),
      }))
    );

    return requestsWithDuration;
  }
}
