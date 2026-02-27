import prisma from '../lib/prisma.ts'

const leaveId = '6ec41ce2-4009-4e7e-a200-7fb43b6e1234'

async function main() {
  const leave = await prisma.leaveRequest.findUnique({
    where: { id: leaveId },
    select: { id: true, status: true, approverId: true, userId: true, updatedAt: true }
  })

  const steps = await prisma.approvalStep.findMany({
    where: { leaveId },
    select: { id: true, approverId: true, status: true, sequenceOrder: true, policyId: true, projectId: true },
    orderBy: [{ policyId: 'asc' }, { sequenceOrder: 'asc' }, { approverId: 'asc' }]
  })

  console.log(JSON.stringify({ leave, steps }, null, 2))
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
