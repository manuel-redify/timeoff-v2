import prisma from '../lib/prisma'

async function main() {
  // Create default contract types
  const contractTypes = [
    { name: 'Employee', description: 'Full-time employee', color: '#3498db' },
    { name: 'Contractor', description: 'Contract worker', color: '#e74c3c' },
    { name: 'Intern', description: 'Internship position', color: '#f39c12' },
    { name: 'Part-time', description: 'Part-time employee', color: '#9b59b6' }
  ]

  for (const ct of contractTypes) {
    await prisma.contractType.upsert({
      where: { name: ct.name },
      update: ct,
      create: ct
    })
  }

  console.log('Default contract types created!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })