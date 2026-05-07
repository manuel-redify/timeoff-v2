import prisma from '../lib/prisma.ts';

async function main() {
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
}

main().finally(async () => {
  await prisma.$disconnect();
});
