import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface UpcomingCountCardProps {
  value: number;
  className?: string;
}

export function UpcomingCountCard({ value, className }: UpcomingCountCardProps) {
  return (
    <Card
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-4 rounded-xl border p-6 shadow-sm",
        className
      )}
      data-testid="upcoming-count-card"
    >
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-neutral-400">
          Upcoming
        </span>
        <span className="text-2xl font-semibold tracking-tight">
          {value}
        </span>
      </div>
    </Card>
  );
}
