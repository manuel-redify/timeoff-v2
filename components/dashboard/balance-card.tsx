import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface BalanceCardProps {
  value: number;
  className?: string;
}

export function BalanceCard({ value, className }: BalanceCardProps) {
  return (
    <Card
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-4 rounded-xl border p-6 shadow-sm",
        className
      )}
      data-testid="balance-card"
    >
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-neutral-400">
          Balance
        </span>
        <span className="text-2xl font-semibold tracking-tight">
          {value}
        </span>
      </div>
    </Card>
  );
}
