import { cache } from 'react';
import prisma from '@/lib/prisma';
import { DayPart } from '@/lib/generated/prisma/enums';
import { $Enums } from '@/lib/generated/prisma/client';
import { LeaveCalculationService } from '@/lib/leave-calculation-service';
import { AllowanceService, AllowanceBreakdownUserContext } from '@/lib/allowance-service';
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
          status: { in: [$Enums.LeaveStatus.APPROVED, $Enums.LeaveStatus.NEW] },
        },
        include: leaveRequestInclude,
        orderBy: { dateStart: 'asc' },
      });
    }
  );

  static async getLeavesTakenYTD(
    userId: string,
    options?: {
      year?: number;
      preloadedUser?: AllowanceBreakdownUserContext;
    }
  ): Promise<number> {
    const targetYear = options?.year ?? new Date().getFullYear();
    const yearStart = new Date(targetYear, 0, 1);
    const yearEnd = new Date(targetYear, 11, 31);

    const approved = await prisma.leaveRequest.findMany({
      where: {
        userId,
        deletedAt: null,
        status: $Enums.LeaveStatus.APPROVED,
        dateStart: { lte: yearEnd },
        dateEnd: { gte: yearStart },
        leaveType: { useAllowance: true },
      },
      select: {
        dateStart: true,
        dayPartStart: true,
        dateEnd: true,
        dayPartEnd: true,
      },
    });

    if (approved.length === 0) {
      return 0;
    }

    const context = await LeaveCalculationService.buildCalculationContext(
      userId,
      yearStart,
      yearEnd,
      options?.preloadedUser
    );

    let total = 0;
    for (const leave of approved) {
      total += LeaveCalculationService.calculateLeaveDaysWithContext(
        context,
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
          status: { in: [$Enums.LeaveStatus.NEW, $Enums.LeaveStatus.PENDING_REVOKE] },
        },
      });
    }
  );

  static getUpcomingCount = cache(
    async (userId: string): Promise<number> => {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

      return prisma.leaveRequest.count({
        where: {
          userId,
          deletedAt: null,
          status: $Enums.LeaveStatus.APPROVED,
          dateStart: { gte: tomorrow },
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

  static async checkOverlap(
    userId: string,
    dateStart: Date,
    dateEnd: Date,
    excludeRequestId?: string
  ): Promise<{ hasOverlap: boolean; overlappingRequests: LeaveRequestWithRelations[] }> {
    const existingRequests = await prisma.leaveRequest.findMany({
      where: {
        userId,
        deletedAt: null,
        status: { in: ['new', 'approved', 'pending_revoke'] },
        ...(excludeRequestId ? { id: { not: excludeRequestId } } : {}),
        OR: [
          {
            AND: [
              { dateStart: { lte: dateStart } },
              { dateEnd: { gte: dateStart } },
            ],
          },
          {
            AND: [
              { dateStart: { lte: dateEnd } },
              { dateEnd: { gte: dateEnd } },
            ],
          },
          {
            AND: [
              { dateStart: { gte: dateStart } },
              { dateEnd: { lte: dateEnd } },
            ],
          },
        ],
      },
      include: leaveRequestInclude,
    });

    return {
      hasOverlap: existingRequests.length > 0,
      overlappingRequests: existingRequests,
    };
  }

  static async checkAllowance(
    userId: string,
    durationMinutes: number,
    year?: number
  ): Promise<{ isExceeded: boolean; remainingMinutes: number; warning?: string }> {
    const targetYear = year ?? new Date().getFullYear();
    const allowanceInfo = await this.getUserAllowance(userId, targetYear);

    const remainingMinutes = (allowanceInfo.availableAllowance * 60) - durationMinutes;
    const isExceeded = remainingMinutes < 0;

    let warning: string | undefined;
    if (isExceeded) {
      const excessHours = Math.abs(remainingMinutes) / 60;
      warning = `Warning: This request exceeds your remaining balance by ${excessHours.toFixed(1)} hours.`;
    }

    return {
      isExceeded,
      remainingMinutes,
      warning,
    };
  }
}
