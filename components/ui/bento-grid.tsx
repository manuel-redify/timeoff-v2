import { cn } from "@/lib/utils"

interface BentoGridProps {
  children: React.ReactNode
  className?: string
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 lg:grid-cols-4 gap-4",
        className
      )}
    >
      {children}
    </div>
  )
}

interface BentoItemProps {
  children: React.ReactNode
  className?: string
  colSpan?: 1 | 2 | 3 | 4
  rowSpan?: 1 | 2
}

export function BentoItem({ 
  children, 
  className, 
  colSpan = 1,
  rowSpan = 1 
}: BentoItemProps) {
  const colSpanClasses = {
    1: "lg:col-span-1",
    2: "lg:col-span-2",
    3: "lg:col-span-3",
    4: "lg:col-span-4",
  }

  const rowSpanClasses = {
    1: "",
    2: "lg:row-span-2",
  }

  return (
    <div
      className={cn(
        colSpanClasses[colSpan],
        rowSpanClasses[rowSpan],
        className
      )}
    >
      {children}
    </div>
  )
}

interface BentoKpiGridProps {
  children: React.ReactNode
  className?: string
}

export function BentoKpiGrid({ children, className }: BentoKpiGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-4",
        className
      )}
    >
      {children}
    </div>
  )
}
