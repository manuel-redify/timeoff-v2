"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, ReactNode } from "react"
import { PageLoadingSkeleton } from "./loading-skeletons"
import { AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface AdminGuardProps {
  children: ReactNode
  fallback?: ReactNode
}

export function AdminGuard({ children, fallback }: AdminGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user?.id) {
      router.push('/login')
      return
    }

    if (!session?.user?.isAdmin) {
      router.push('/?error=access_denied')
      return
    }
  }, [session, status, router])

  if (status === 'loading') {
    return fallback || <PageLoadingSkeleton message="Checking permissions..." />
  }

  if (!session?.user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              <p>You don't have administrator privileges to access this page.</p>
              <p className="mt-2">Please contact your system administrator if you believe this is an error.</p>
            </div>
            <Button onClick={() => router.push('/')} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}