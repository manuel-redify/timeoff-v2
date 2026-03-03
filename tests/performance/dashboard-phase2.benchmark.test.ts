import { performance } from "node:perf_hooks";
import prisma from "@/lib/prisma";
import { LeaveRequestService } from "@/lib/services/leave-request.service";
import { AllowanceService } from "@/lib/allowance-service";

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(index, 0)];
}

function summary(values: number[]) {
  const sum = values.reduce((acc, n) => acc + n, 0);
  return {
    min: Math.min(...values),
    avg: sum / values.length,
    p50: percentile(values, 50),
    p95: percentile(values, 95),
    max: Math.max(...values),
  };
}

describe("Dashboard Phase 2 benchmark", () => {
  it("profiles optimized dashboard KPI path on a high-history user", async () => {
    const currentYear = new Date().getFullYear();
    const iterations = 15;

    const topUsers = await prisma.leaveRequest.groupBy({
      by: ["userId"],
      where: {
        deletedAt: null,
      },
      _count: { _all: true },
      orderBy: {
        _count: {
          userId: "desc",
        },
      },
      take: 5,
    });

    if (topUsers.length === 0) {
      console.log("[phase2-benchmark] No leave request data found; benchmark skipped.");
      return;
    }

    const selected = topUsers[0];

    const user = await prisma.user.findUnique({
      where: { id: selected.userId },
      include: {
        department: true,
        company: true,
        allowanceAdjustments: {
          where: { year: currentYear },
          take: 1,
        },
      },
    });

    if (!user) {
      console.log(`[phase2-benchmark] User ${selected.userId} not found; benchmark skipped.`);
      return;
    }

    const approvedAllowanceLeaves = await prisma.leaveRequest.count({
      where: {
        userId: user.id,
        deletedAt: null,
        status: "APPROVED" as any,
        dateStart: { lte: new Date(currentYear, 11, 31) },
        dateEnd: { gte: new Date(currentYear, 0, 1) },
        leaveType: { useAllowance: true },
      },
    });

    // Warm-up
    await Promise.all([
      AllowanceService.getAllowanceBreakdown(user.id, currentYear, { user }),
      LeaveRequestService.getLeavesTakenYTD(user.id, { year: currentYear, preloadedUser: user }),
      LeaveRequestService.getPendingRequests(user.id),
      LeaveRequestService.getUpcomingCount(user.id),
      LeaveRequestService.getNextLeave(user.id),
    ]);

    const leavesTakenTimes: number[] = [];
    const allowanceTimes: number[] = [];
    const dashboardBundleTimes: number[] = [];

    for (let i = 0; i < iterations; i++) {
      let start = performance.now();
      await LeaveRequestService.getLeavesTakenYTD(user.id, { year: currentYear, preloadedUser: user });
      leavesTakenTimes.push(performance.now() - start);

      start = performance.now();
      await AllowanceService.getAllowanceBreakdown(user.id, currentYear, { user });
      allowanceTimes.push(performance.now() - start);

      start = performance.now();
      await Promise.all([
        AllowanceService.getAllowanceBreakdown(user.id, currentYear, { user }),
        LeaveRequestService.getPendingRequests(user.id),
        LeaveRequestService.getUpcomingCount(user.id),
        LeaveRequestService.getLeavesTakenYTD(user.id, { year: currentYear, preloadedUser: user }),
        LeaveRequestService.getNextLeave(user.id),
      ]);
      dashboardBundleTimes.push(performance.now() - start);
    }

    const result = {
      year: currentYear,
      userId: user.id,
      userName: `${user.name} ${user.lastname}`,
      topUserRequestCountAllTime: selected._count._all,
      approvedAllowanceLeavesInYear: approvedAllowanceLeaves,
      iterations,
      getLeavesTakenYTD_ms: summary(leavesTakenTimes),
      getAllowanceBreakdown_ms: summary(allowanceTimes),
      dashboardKpiBundle_ms: summary(dashboardBundleTimes),
    };

    console.log("[phase2-benchmark] " + JSON.stringify(result, null, 2));
  }, 120000);
});
