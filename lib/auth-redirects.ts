import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

/**
 * Standardized redirect utilities for authentication
 */

// Client-side redirects
export const authRedirects = {
  toLogin: () => redirect('/login'),
  toDashboard: () => redirect('/dashboard'),
  toHome: () => redirect('/'),
  toAccessDenied: () => redirect('/?error=access_denied')
}

// Server-side redirects for middleware/API routes
export const serverAuthRedirects = {
  toLogin: (requestUrl?: string) => {
    return NextResponse.redirect(new URL('/login', requestUrl || 'http://localhost'))
  },
  toDashboard: (requestUrl?: string) => {
    return NextResponse.redirect(new URL('/dashboard', requestUrl || 'http://localhost'))
  },
  toUnauthorized: (requestUrl?: string) => {
    return NextResponse.redirect(new URL('/?error=unauthorized', requestUrl || 'http://localhost'))
  }
}

// Redirect URLs with parameters
export const createRedirectUrl = (path: string, params?: Record<string, string>) => {
  const url = new URL(path, 'http://localhost')
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
  }
  return url.toString().replace('http://localhost', '')
}

// Common redirect patterns
export const redirectPatterns = {
  loginRequired: createRedirectUrl('/login', { message: 'login_required' }),
  sessionExpired: createRedirectUrl('/login', { message: 'session_expired' }),
  accessDenied: createRedirectUrl('/?error=access_denied'),
  loginSuccess: createRedirectUrl('/dashboard', { welcome: 'true' }),
  logoutSuccess: createRedirectUrl('/login', { message: 'logout_success' })
}

// Check if current user is authenticated (for client-side usage)
export async function checkClientAuth() {
  try {
    const session = await auth()
    return !!session?.user?.id
  } catch (error) {
    console.error('Auth check error:', error)
    return false
  }
}

// Standard error messages
export const authErrorMessages = {
  unauthorized: 'You must be logged in to access this page.',
  forbidden: 'You do not have permission to access this page.',
  sessionExpired: 'Your session has expired. Please log in again.',
  loginRequired: 'Please log in to continue.',
  accessDenied: 'Access denied. Insufficient permissions.'
} as const