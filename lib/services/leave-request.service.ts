import { cache } from 'react';
import prisma from '@/lib/prisma';
import { LeaveStatus, DayPart } from '@/lib/generated/prisma/client';
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
          status: { in: [LeaveStatus.APPROVED, LeaveStatus.NEW] },
        },
        include: leaveRequestInclude,
        orderBy: { dateStart: 'asc' },
      });
    }
  );

  static async getLeavesTakenYTD(userId: string): Promise<number> {
    const now = new Date();
    const yearStart = startOfYear(now);

    const approved = await prisma.leaveRequest.findMany({
      where: {
        userId,
        deletedAt: null,
        status: LeaveStatus.APPROVED,
        dateStart: { lte: now },
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
        leave.dateEnd < now ? leave.dateEnd : now,
        leave.dateEnd < now ? leave.dayPartEnd : DayPart.ALL,
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
          status: { in: [LeaveStatus.NEW, LeaveStatus.PENDING_REVOKE] },
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
          status: LeaveStatus.APPROVED,
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
}
