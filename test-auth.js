// Simple test to verify auth protection is working
// This can be run with: node -r dotenv/config test-auth.js

const { createServer } = require('http')
const { parse } = require('url')

const testCases = [
  { path: '/', expectedRedirect: true },
  { path: '/calendar', expectedRedirect: true },
  { path: '/admin/users', expectedRedirect: true },
  { path: '/login', expectedRedirect: false },
  { path: '/api/auth/session', expectedRedirect: false },
  { path: '/api/users/me', expectedRedirect: false } // API routes return 401, not redirect
]

async function testAuthProtection() {
  console.log('🧪 Testing Authentication Protection')
  console.log('=====================================\n')
  
  for (const test of testCases) {
    console.log(`📍 Testing: ${test.path}`)
    
    try {
      const response = await fetch(`http://localhost:3000${test.path}`, {
        redirect: 'manual', // Don't follow redirects automatically
        headers: {
          'User-Agent': 'test-script'
        }
      })
      
      const isRedirect = response.status >= 300 && response.status < 400
      const redirectLocation = response.headers.get('location')
      
      if (test.expectedRedirect) {
        if (isRedirect && redirectLocation?.includes('/login')) {
          console.log('✅ PASS: Correctly redirected to login')
        } else {
          console.log('❌ FAIL: Expected redirect to login, got:', response.status, redirectLocation)
        }
      } else {
        if (!isRedirect) {
          console.log('✅ PASS: Public route accessible')
        } else {
          console.log('❌ FAIL: Public route unexpectedly redirected')
        }
      }
      
      console.log(`   Status: ${response.status}`)
      if (redirectLocation) {
        console.log(`   Redirect: ${redirectLocation}`)
      }
      
    } catch (error) {
      console.log('❌ ERROR: Could not connect to server')
      console.log(`   Details: ${error.message}`)
    }
    
    console.log('')
  }
  
  console.log('🔍 Manual Testing Required:')
  console.log('- Test API endpoints return 401 for unauthenticated requests')
  console.log('- Test admin routes reject non-admin users')
  console.log('- Test session expiration scenarios')
  console.log('- Test browser back button after logout')
}

if (require.main === module) {
  testAuthProtection().catch(console.error)
}

module.exports = { testAuthProtection }