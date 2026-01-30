"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface AuthErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface AuthErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; reset: () => void }>
}

export class AuthErrorBoundary extends React.Component<AuthErrorBoundaryProps, AuthErrorBoundaryState> {
  constructor(props: AuthErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Auth Error Boundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultAuthErrorFallback
      return <FallbackComponent error={this.state.error} reset={() => this.setState({ hasError: false, error: undefined })} />
    }

    return this.props.children
  }
}

function DefaultAuthErrorFallback({ error, reset }: { error?: Error; reset: () => void }) {
  const router = useRouter()

  const handleRedirectToLogin = () => {
    router.push('/login')
  }

  const isAuthError = error?.message?.includes('Unauthorized') || 
                   error?.message?.includes('Forbidden') ||
                   error?.message?.includes('Session')

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Authentication Error
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {isAuthError ? (
              <p>Your session may have expired or you may not have permission to access this resource.</p>
            ) : (
              <p>An unexpected error occurred while checking your authentication.</p>
            )}
            {process.env.NODE_ENV === 'development' && error && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-slate-500">Error details</summary>
                <pre className="mt-2 text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded overflow-auto">
                  {error.message}
                </pre>
              </details>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleRedirectToLogin}
              className="flex-1"
            >
              Go to Login
            </Button>
            <Button 
              variant="outline" 
              onClick={reset}
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function useAuthErrorHandler() {
  const router = useRouter()

  const handleAuthError = (error: any) => {
    console.error('Authentication error:', error)
    
    // Handle specific error types
    if (error?.message === 'UNAUTHORIZED' || error?.status === 401) {
      router.push('/login')
      return
    }
    
    if (error?.message === 'FORBIDDEN' || error?.status === 403) {
      router.push('/') // or show access denied page
      return
    }
    
    // For other errors, you might want to show a toast or error boundary
  }

  return { handleAuthError }
}