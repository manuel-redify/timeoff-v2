import { SkeletonCard, SkeletonHeroCard, SkeletonKpiCard } from "@/components/ui/skeleton-card"
import { SkeletonTable } from "@/components/ui/skeleton-table"

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="h-9 w-40 bg-accent animate-pulse rounded-md" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SkeletonHeroCard className="lg:col-span-1" />
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SkeletonKpiCard />
          <SkeletonKpiCard />
          <SkeletonKpiCard />
          <SkeletonKpiCard />
        </div>
      </div>

      <div className="space-y-4">
        <div className="h-7 w-32 bg-accent animate-pulse rounded-md" />
        <SkeletonTable columns={5} rows={5} showActions />
      </div>
    </div>
  )
}
