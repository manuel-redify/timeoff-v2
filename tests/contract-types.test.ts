import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import prisma from '../lib/prisma'

describe('Contract Types Integration', () => {
  beforeAll(async () => {
    // Setup test data
    await prisma.contractType.createMany({
      data: [
        { name: 'Employee', description: 'Full-time employee', color: '#3498db' },
        { name: 'Contractor', description: 'Contract worker', color: '#e74c3c' },
        { name: 'Intern', description: 'Internship position', color: '#f39c12' }
      ]
    })
  })

  afterAll(async () => {
    // Cleanup test data
    await prisma.contractType.deleteMany({})
    await prisma.$disconnect()
  })

  it('should create contract types', async () => {
    const contractTypes = await prisma.contractType.findMany()
    expect(contractTypes).toHaveLength(3)
    expect(contractTypes[0].name).toBe('Employee')
  })

  it('should allow users to have contract type references', async () => {
    const employee = await prisma.contractType.findUnique({
      where: { name: 'Employee' }
    })

    if (employee) {
      // Test creating a user with contract type reference
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test',
          lastname: 'User',
          companyId: 'test-company-id',
          contractTypeId: employee.id
        }
      })

      expect(user.contractTypeId).toBe(employee.id)
      await prisma.user.delete({ where: { id: user.id } })
    }
  })

  it('should query users by contract type', async () => {
    const employee = await prisma.contractType.findUnique({
      where: { name: 'Employee' }
    })

    if (employee) {
      // Create test users
      await prisma.user.createMany({
        data: [
          {
            email: 'user1@example.com',
            name: 'User',
            lastname: 'One',
            companyId: 'test-company-id',
            contractTypeId: employee.id
          },
          {
            email: 'user2@example.com',
            name: 'User',
            lastname: 'Two',
            companyId: 'test-company-id',
            contractTypeId: employee.id
          }
        ]
      })

      // Test groupBy query
      const userGroups = await prisma.user.groupBy({
        by: ['contractTypeId'],
        where: {
          deletedAt: null,
          contractTypeId: { not: null }
        },
        _count: true
      })

      expect(userGroups).toHaveLength(1)
      expect(userGroups[0].contractTypeId).toBe(employee.id)
      expect(userGroups[0]._count).toBe(2)

      // Cleanup
      await prisma.user.deleteMany({
        where: { companyId: 'test-company-id' }
      })
    }
  })
})