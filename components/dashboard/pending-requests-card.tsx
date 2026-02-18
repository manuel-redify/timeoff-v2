import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PendingRequestsCardProps {
  value: number;
  className?: string;
}

export function PendingRequestsCard({ value, className }: PendingRequestsCardProps) {
  const hasPending = value > 0;

  return (
    <Card
      className={cn(
        "relative bg-card text-card-foreground flex flex-col gap-4 rounded-xl border p-6 shadow-sm",
        className
      )}
      data-testid="pending-requests-card"
    >
      {/* Neon Lime dot positioned top-right */}
      {hasPending && (
        <div
          className="absolute top-4 right-4 h-3 w-3 rounded-full"
          style={{ backgroundColor: "#e2f337" }}
          data-testid="pending-requests-indicator"
          aria-hidden="true"
        />
      )}

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-neutral-400">
          Pending Requests
        </span>
        <span className="text-2xl font-semibold tracking-tight">
          {value}
        </span>
      </div>
    </Card>
  );
}
