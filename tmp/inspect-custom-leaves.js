const prisma = require('../lib/prisma.ts').default;

(async () => {
  const rows = await prisma.leaveRequest.findMany({
    where: {
      deletedAt: null,
      customStartMinutes: { not: null },
      customEndMinutes: { not: null },
    },
    select: {
      id: true,
      dateStart: true,
      dateEnd: true,
      dayPartStart: true,
      dayPartEnd: true,
      customStartMinutes: true,
      customEndMinutes: true,
      durationMinutes: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  console.log(JSON.stringify(rows, null, 2));
  await prisma.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
