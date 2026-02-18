import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface SkeletonCardProps {
  className?: string
  header?: boolean
  content?: boolean
  footer?: boolean
  contentRows?: number
}

export function SkeletonCard({
  className,
  header = true,
  content = true,
  footer = false,
  contentRows = 3,
}: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        className
      )}
    >
      {header && (
        <div className="px-6 space-y-2">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      )}
      
      {content && (
        <div className="px-6 space-y-3">
          {Array.from({ length: contentRows }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      )}
      
      {footer && (
        <div className="px-6 pt-2">
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      )}
    </div>
  )
}

interface SkeletonHeroCardProps {
  className?: string
}

export function SkeletonHeroCard({ className }: SkeletonHeroCardProps) {
  return (
    <div
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        className
      )}
    >
      <div className="px-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
        <Skeleton className="h-12 w-48" />
        <div className="flex items-center gap-4 pt-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </div>
    </div>
  )
}

interface SkeletonKpiCardProps {
  className?: string
}

export function SkeletonKpiCard({ className }: SkeletonKpiCardProps) {
  return (
    <div
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-4 rounded-xl border p-6 shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-full" />
    </div>
  )
}
