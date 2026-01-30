"use client"

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface ProtectedLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function ProtectedLink({ href, children, className, onClick }: ProtectedLinkProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  const handleClick = (e: React.MouseEvent) => {
    if (status === 'loading') {
      e.preventDefault()
      return
    }

    if (!session) {
      e.preventDefault()
      router.push('/login')
      return
    }

    if (onClick) {
      onClick()
    }
  }

  return (
    <Link 
      href={href} 
      className={className}
      onClick={handleClick}
    >
      {children}
    </Link>
  )
}