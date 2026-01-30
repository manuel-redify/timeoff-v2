import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getCurrentUser } from '@/lib/rbac'

/**
 * Standard API authentication check
 * Returns user object if authenticated, null otherwise
 */
export async function authenticate() {
  try {
    const user = await getCurrentUser()
    return user
  } catch (error) {
    console.error('Authentication error:', error)
    return null
  }
}

/**
 * Standard unauthorized response
 */
export function unauthorizedResponse(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 })
}

/**
 * Standard forbidden response  
 */
export function forbiddenResponse(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 })
}

/**
 * Require authentication for API routes
 * Usage: const user = await requireAuth(); if (!user) return unauthorizedResponse();
 */
export async function requireAuth() {
  const user = await authenticate()
  if (!user) {
    throw new Error('UNAUTHORIZED')
  }
  return user
}

/**
 * Require admin role for API routes
 * Usage: try { const user = await requireAdmin(); } catch (e) { return forbiddenResponse(); }
 */
export async function requireAdmin() {
  const user = await requireAuth()
  if (!user.isAdmin) {
    throw new Error('FORBIDDEN')
  }
  return user
}

/**
 * Handle authentication errors consistently
 */
export function handleAuthError(error: any) {
  if (error.message === 'UNAUTHORIZED') {
    return unauthorizedResponse()
  }
  if (error.message === 'FORBIDDEN') {
    return forbiddenResponse()
  }
  
  console.error('API Error:', error)
  return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
}