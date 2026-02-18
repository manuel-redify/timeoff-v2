jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    leaveRequest: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock('../lib/leave-calculation-service', () => ({
  LeaveCalculationService: {
    calculateLeaveDays: jest.fn(),
  },
}));

jest.mock('../lib/allowance-service', () => ({
  AllowanceService: {
    getAllowanceBreakdown: jest.fn(),
  },
}));

import prisma from '../lib/prisma';
import { LeaveCalculationService } from '../lib/leave-calculation-service';
import { AllowanceService } from '../lib/allowance-service';
import { LeaveRequestService } from '../lib/services/leave-request.service';
import { LeaveStatus, DayPart } from '../lib/generated/prisma/enums';

const prismaMock = prisma as any;
const calcMock = LeaveCalculationService as any;
const allowanceMock = AllowanceService as any;

describe('LeaveRequestService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getLeaveRequests', () => {
    it('should return leave requests for a user and year with relations', async () => {
      const mockRequests = [
        {
          id: 'lr-1',
          userId: 'user-1',
          dateStart: new Date('2026-03-01'),
          dateEnd: new Date('2026-03-05'),
          status: LeaveStatus.APPROVED,
          leaveType: { id: 'lt-1', name: 'Annual Leave', color: '#00ff00' },
          approvalSteps: [{ id: 'as-1', sequenceOrder: 1 }],
        },
      ];
      prismaMock.leaveRequest.findMany.mockResolvedValue(mockRequests);

      const result = await LeaveRequestService.getLeaveRequests('user-1', 2026);

      expect(prismaMock.leaveRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user-1', deletedAt: null }),
          include: expect.objectContaining({
            leaveType: true,
            approvalSteps: expect.objectContaining({
              orderBy: { sequenceOrder: 'asc' },
            }),
          }),
        })
      );
      expect(result).toEqual(mockRequests);
    });
  });

  describe('getNextLeave', () => {
    it('should return the next upcoming leave', async () => {
      const mockLeave = {
        id: 'lr-1',
        dateStart: new Date('2026-03-10'),
        dateEnd: new Date('2026-03-12'),
        status: LeaveStatus.APPROVED,
        leaveType: { id: 'lt-1', name: 'Annual Leave' },
        approvalSteps: [],
      };
      prismaMock.leaveRequest.findFirst.mockResolvedValue(mockLeave);

      const result = await LeaveRequestService.getNextLeave('user-1');

      expect(prismaMock.leaveRequest.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-1',
            deletedAt: null,
            status: { in: [LeaveStatus.APPROVED, LeaveStatus.NEW] },
          }),
          orderBy: { dateStart: 'asc' },
        })
      );
      expect(result).toEqual(mockLeave);
    });

    it('should return null when no upcoming leave exists', async () => {
      prismaMock.leaveRequest.findFirst.mockResolvedValue(null);

      const result = await LeaveRequestService.getNextLeave('user-1');

      expect(result).toBeNull();
    });
  });

  describe('getLeavesTakenYTD', () => {
    it('should sum approved leave days for the current year', async () => {
      prismaMock.leaveRequest.findMany.mockResolvedValue([
        {
          id: 'lr-1',
          dateStart: new Date('2026-01-05'),
          dateEnd: new Date('2026-01-09'),
          dayPartStart: DayPart.ALL,
          dayPartEnd: DayPart.ALL,
          status: LeaveStatus.APPROVED,
        },
        {
          id: 'lr-2',
          dateStart: new Date('2026-02-10'),
          dateEnd: new Date('2026-02-11'),
          dayPartStart: DayPart.ALL,
          dayPartEnd: DayPart.ALL,
          status: LeaveStatus.APPROVED,
        },
      ]);
      calcMock.calculateLeaveDays
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(2);

      const result = await LeaveRequestService.getLeavesTakenYTD('user-1');

      expect(result).toBe(7);
      expect(calcMock.calculateLeaveDays).toHaveBeenCalledTimes(2);
    });

    it('should return 0 when no approved leaves exist', async () => {
      prismaMock.leaveRequest.findMany.mockResolvedValue([]);

      const result = await LeaveRequestService.getLeavesTakenYTD('user-1');

      expect(result).toBe(0);
    });
  });

  describe('getPendingRequests', () => {
    it('should count NEW and PENDING_REVOKE requests', async () => {
      prismaMock.leaveRequest.count.mockResolvedValue(3);

      const result = await LeaveRequestService.getPendingRequests('user-1');

      expect(prismaMock.leaveRequest.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-1',
            deletedAt: null,
            status: { in: [LeaveStatus.NEW, LeaveStatus.PENDING_REVOKE] },
          }),
        })
      );
      expect(result).toBe(3);
    });
  });

  describe('getUpcomingCount', () => {
    it('should count approved requests with future dateStart', async () => {
      prismaMock.leaveRequest.count.mockResolvedValue(2);

      const result = await LeaveRequestService.getUpcomingCount('user-1');

      expect(prismaMock.leaveRequest.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-1',
            deletedAt: null,
            status: LeaveStatus.APPROVED,
          }),
        })
      );
      expect(result).toBe(2);
    });
  });

  describe('getUserAllowance', () => {
    it('should return allowance info from AllowanceService', async () => {
      allowanceMock.getAllowanceBreakdown.mockResolvedValue({
        totalAllowance: 25,
        usedAllowance: 10,
        pendingAllowance: 3,
        availableAllowance: 12,
      });

      const result = await LeaveRequestService.getUserAllowance('user-1', 2026);

      expect(allowanceMock.getAllowanceBreakdown).toHaveBeenCalledWith('user-1', 2026);
      expect(result).toEqual({
        totalAllowance: 25,
        usedAllowance: 10,
        pendingAllowance: 3,
        availableAllowance: 12,
      });
    });

    it('should default to current year when year is not provided', async () => {
      allowanceMock.getAllowanceBreakdown.mockResolvedValue({
        totalAllowance: 20,
        usedAllowance: 0,
        pendingAllowance: 0,
        availableAllowance: 20,
      });

      await LeaveRequestService.getUserAllowance('user-1');

      expect(allowanceMock.getAllowanceBreakdown).toHaveBeenCalledWith(
        'user-1',
        new Date().getFullYear()
      );
    });
  });

  describe('getDashboardKpis', () => {
    it('should return all KPIs in parallel', async () => {
      prismaMock.leaveRequest.findMany.mockResolvedValue([]);
      prismaMock.leaveRequest.count
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(5);

      const result = await LeaveRequestService.getDashboardKpis('user-1');

      expect(result).toEqual({
        leavesTakenYTD: 0,
        pendingRequests: 2,
        upcomingCount: 5,
      });
    });
  });
});
