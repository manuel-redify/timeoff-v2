import prisma from '../lib/prisma'
import { readFileSync } from 'fs'
import { join } from 'path'

async function applyRlsPolicies() {
  try {
    console.log('Applying RLS policies...')
    
    const sqlPath = join(__dirname, '../prisma/rls_policies.sql')
    const sql = readFileSync(sqlPath, 'utf8')
    
    // Execute the SQL
    await prisma.$executeRawUnsafe(sql)
    
    console.log('RLS policies applied successfully!')
  } catch (error) {
    console.error('Error applying RLS policies:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

applyRlsPolicies()