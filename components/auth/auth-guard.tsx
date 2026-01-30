"use client"

import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  // Skip auth check for public routes
  const publicRoutes = ['/login']
  const isPublicRoute = publicRoutes.some(route => pathname?.startsWith(route))

  // Show loading while checking auth
  if (status === 'loading') {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-slate-600 dark:text-slate-400" />
          <div className="text-center">
            <p className="text-slate-600 dark:text-slate-400 font-medium">Checking authentication...</p>
            <p className="text-slate-500 dark:text-slate-500 text-sm">Please wait a moment</p>
          </div>
        </div>
      </div>
    )
  }

  // Redirect unauthenticated users (client-side backup)
  if (!session && !isPublicRoute) {
    router.push('/login')
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-slate-600 dark:text-slate-400" />
          <p className="text-slate-600 dark:text-slate-400">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export function useAuthGuard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  const isAuthenticated = status === 'authenticated' && !!session?.user?.id
  const isLoading = status === 'loading'

  const requireAuth = () => {
    if (!isAuthenticated && !isLoading) {
      router.push('/login')
    }
  }

  return {
    session,
    isAuthenticated,
    isLoading,
    requireAuth
  }
}