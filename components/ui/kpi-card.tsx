import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    label: string
    positive?: boolean
  }
  className?: string
  highlight?: boolean
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  className,
  highlight = false,
}: KpiCardProps) {
  return (
    <Card
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-4 rounded-xl border p-6 shadow-sm",
        highlight && "border-l-4 border-l-primary",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          {title}
        </span>
        {icon && (
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <div className="text-2xl font-bold tracking-tight">
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>

      {trend && (
        <div className="flex items-center gap-1 text-xs">
          <span
            className={cn(
              "font-medium",
              trend.positive ? "text-green-600" : "text-red-600"
            )}
          >
            {trend.positive ? "+" : "-"}{trend.value}%
          </span>
          <span className="text-muted-foreground">{trend.label}</span>
        </div>
      )}
    </Card>
  )
}

interface KpiCardCompactProps {
  title: string
  value: string | number
  icon?: React.ReactNode
  className?: string
}

export function KpiCardCompact({
  title,
  value,
  icon,
  className,
}: KpiCardCompactProps) {
  return (
    <Card
      className={cn(
        "bg-card text-card-foreground flex items-center justify-between rounded-xl border p-4 shadow-sm",
        className
      )}
    >
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">
          {title}
        </p>
        <p className="text-xl font-bold tracking-tight">
          {value}
        </p>
      </div>
      {icon && (
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
          {icon}
        </div>
      )}
    </Card>
  )
}
