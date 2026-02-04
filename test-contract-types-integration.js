import prisma from '../lib/prisma'

async function testContractTypes() {
  try {
    console.log('Testing Contract Types Integration...')
    
    // 1. Create a test contract type
    const contractType = await prisma.contractType.create({
      data: {
        name: 'Test Employee',
        description: 'Test contract type',
        color: '#3498db'
      }
    })
    console.log('✓ Created contract type:', contractType.name, 'ID:', contractType.id)

    // 2. Create a test user with contract type reference
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        name: 'Test',
        lastname: 'User',
        companyId: 'test-company-id', // This would need to exist
        contractTypeId: contractType.id
      }
    })
    console.log('✓ Created user with contract type reference:', user.email, 'contractTypeId:', user.contractTypeId)

    // 3. Test groupBy query (used in API)
    const userGroups = await prisma.user.groupBy({
      by: ['contractTypeId'],
      where: {
        deletedAt: null,
        contractTypeId: { not: null }
      },
      _count: true
    })
    console.log('✓ GroupBy query result:', userGroups)

    // 4. Test employee count
    const employeeCount = await prisma.user.count({
      where: {
        contractTypeId: contractType.id,
        deletedAt: null
      }
    })
    console.log('✓ Employee count for contract type:', employeeCount)

    // 5. Cleanup
    await prisma.user.delete({ where: { id: user.id } })
    await prisma.contractType.delete({ where: { id: contractType.id } })
    console.log('✓ Cleanup completed')

    console.log('✅ All contract types integration tests passed!')

  } catch (error) {
    console.error('❌ Contract types integration test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testContractTypes()