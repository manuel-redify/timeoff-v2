const { performance } = require("node:perf_hooks");
const { PrismaClient } = require("@prisma/client");
const { eachDayOfInterval, format, getDay, isSameDay, startOfDay, endOfDay } = require("date-fns");

const prisma = new PrismaClient();

function getScheduleValueForDate(schedule, date) {
  const dayOfWeek = getDay(date);
  switch (dayOfWeek) {
    case 0:
      return schedule.sunday;
    case 1:
      return schedule.monday;
    case 2:
      return schedule.tuesday;
    case 3:
      return schedule.wednesday;
    case 4:
      return schedule.thursday;
    case 5:
      return schedule.friday;
    case 6:
      return schedule.saturday;
    default:
      return 2;
  }
}

function calculateLeaveDaysWithContext(context, startDate, dayPartStart, endDate, dayPartEnd) {
  let totalDays = 0;
  const interval = eachDayOfInterval({ start: startDate, end: endDate });

  for (const date of interval) {
    const dateStr = format(date, "yyyy-MM-dd");
    const scheduleValue = getScheduleValueForDate(context.schedule, date);

    const isWorkingFull = scheduleValue === 1;
    const isMorningOnly = scheduleValue === 3;
    const isAfternoonOnly = scheduleValue === 4;
    const isNonWorking = scheduleValue === 2;

    if (isNonWorking) continue;
    if (context.includePublicHolidays && context.holidayDates.has(dateStr)) continue;

    let dayWeight = 0;
    if (isWorkingFull) dayWeight = 1;
    else if (isMorningOnly || isAfternoonOnly) dayWeight = 0.5;

    if (isSameDay(date, startDate) && isSameDay(date, endDate)) {
      if (dayPartStart === "ALL") totalDays += dayWeight;
      else totalDays += 0.5;
    } else if (isSameDay(date, startDate)) {
      if (dayPartStart === "ALL") totalDays += dayWeight;
      else totalDays += 0.5;
    } else if (isSameDay(date, endDate)) {
      if (dayPartEnd === "ALL") totalDays += dayWeight;
      else totalDays += 0.5;
    } else {
      totalDays += dayWeight;
    }
  }

  return totalDays;
}

async function buildContext(user, startDate, endDate) {
  const userSchedule = await prisma.schedule.findFirst({ where: { userId: user.id } });
  const companySchedule = userSchedule
    ? null
    : await prisma.schedule.findFirst({ where: { companyId: user.companyId, userId: null } });
  const schedule =
    userSchedule ||
    companySchedule || {
      monday: 1,
      tuesday: 1,
      wednesday: 1,
      thursday: 1,
      friday: 1,
      saturday: 2,
      sunday: 2,
    };

  const bankHolidays = await prisma.bankHoliday.findMany({
    where: {
      companyId: user.companyId,
      date: {
        gte: startOfDay(startDate),
        lte: endOfDay(endDate),
      },
    },
  });

  return {
    includePublicHolidays: user.department?.includePublicHolidays !== false,
    schedule,
    holidayDates: new Set(bankHolidays.map((h) => format(h.date, "yyyy-MM-dd"))),
  };
}

function summarize(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);
  const pick = (p) => sorted[Math.max(0, Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1))];
  return {
    min: Number(sorted[0].toFixed(2)),
    avg: Number((sum / values.length).toFixed(2)),
    p50: Number(pick(50).toFixed(2)),
    p95: Number(pick(95).toFixed(2)),
    max: Number(sorted[sorted.length - 1].toFixed(2)),
  };
}

async function benchmark() {
  const currentYear = new Date().getFullYear();
  const yearStart = new Date(currentYear, 0, 1);
  const yearEnd = new Date(currentYear, 11, 31);
  const iterations = 12;

  const topUsers = await prisma.leaveRequest.groupBy({
    by: ["userId"],
    where: { deletedAt: null },
    _count: { _all: true },
    orderBy: { _count: { _all: "desc" } },
    take: 5,
  });

  if (!topUsers.length) {
    console.log("No leave requests found. Benchmark skipped.");
    return;
  }

  const selected = topUsers[0];
  const user = await prisma.user.findUnique({
    where: { id: selected.userId },
    include: {
      department: true,
      company: true,
      allowanceAdjustments: { where: { year: currentYear }, take: 1 },
    },
  });

  if (!user) {
    console.log("No user for selected dataset. Benchmark skipped.");
    return;
  }

  const approved = await prisma.leaveRequest.findMany({
    where: {
      userId: user.id,
      deletedAt: null,
      status: "APPROVED",
      dateStart: { lte: yearEnd },
      dateEnd: { gte: yearStart },
      leaveType: { useAllowance: true },
    },
    select: { dateStart: true, dateEnd: true, dayPartStart: true, dayPartEnd: true },
  });

  const optimized = [];
  const naive = [];
  const dashboardBundle = [];

  for (let i = 0; i < iterations; i++) {
    let t0 = performance.now();
    const sharedContext = await buildContext(user, yearStart, yearEnd);
    let total = 0;
    for (const leave of approved) {
      total += calculateLeaveDaysWithContext(
        sharedContext,
        leave.dateStart,
        leave.dayPartStart,
        leave.dateEnd,
        leave.dayPartEnd
      );
    }
    void total;
    optimized.push(performance.now() - t0);

    t0 = performance.now();
    let naiveTotal = 0;
    for (const leave of approved) {
      const leaveContext = await buildContext(user, leave.dateStart, leave.dateEnd);
      naiveTotal += calculateLeaveDaysWithContext(
        leaveContext,
        leave.dateStart,
        leave.dayPartStart,
        leave.dateEnd,
        leave.dayPartEnd
      );
    }
    void naiveTotal;
    naive.push(performance.now() - t0);

    t0 = performance.now();
    await Promise.all([
      prisma.leaveRequest.count({
        where: { userId: user.id, deletedAt: null, status: { in: ["NEW", "PENDING_REVOKE"] } },
      }),
      prisma.leaveRequest.count({
        where: {
          userId: user.id,
          deletedAt: null,
          status: "APPROVED",
          dateStart: { gte: new Date(currentYear, new Date().getMonth(), new Date().getDate() + 1) },
        },
      }),
      prisma.leaveRequest.findFirst({
        where: {
          userId: user.id,
          deletedAt: null,
          dateEnd: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          status: { in: ["APPROVED", "NEW"] },
        },
        orderBy: { dateStart: "asc" },
      }),
    ]);
    dashboardBundle.push(performance.now() - t0);
  }

  const report = {
    timestamp: new Date().toISOString(),
    year: currentYear,
    user: {
      id: user.id,
      name: `${user.name} ${user.lastname}`,
      totalLeaveRowsAllTime: selected._count._all,
      approvedAllowanceLeavesInYear: approved.length,
    },
    iterations,
    getLeavesTakenYTD_equivalent_ms: {
      optimizedSingleContext: summarize(optimized),
      naivePerLeaveContext: summarize(naive),
      speedupFactorAvg: Number((naive.reduce((a, b) => a + b, 0) / optimized.reduce((a, b) => a + b, 0)).toFixed(2)),
    },
    dashboardKpiQueriesBundle_ms: summarize(dashboardBundle),
  };

  console.log(JSON.stringify(report, null, 2));
}

benchmark()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
