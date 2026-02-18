import { BentoGrid, BentoItem, BentoKpiGrid } from "@/components/ui/bento-grid"
import { SkeletonHeroCard, SkeletonKpiCard } from "@/components/ui/skeleton-card"
import { SkeletonTable } from "@/components/ui/skeleton-table"

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="h-9 w-40 bg-accent animate-pulse rounded-md" />
      </div>

      <BentoGrid>
        <BentoItem colSpan={1}>
          <SkeletonHeroCard className="h-full" />
        </BentoItem>
        <BentoItem colSpan={3}>
          <BentoKpiGrid className="h-full">
            <SkeletonKpiCard />
            <SkeletonKpiCard />
            <SkeletonKpiCard />
            <SkeletonKpiCard />
          </BentoKpiGrid>
        </BentoItem>
      </BentoGrid>

      <div className="space-y-4">
        <div className="h-7 w-32 bg-accent animate-pulse rounded-md" />
        <SkeletonTable columns={5} rows={5} showActions />
      </div>
    </div>
  )
}
