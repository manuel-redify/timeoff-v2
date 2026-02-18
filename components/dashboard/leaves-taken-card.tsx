import { Briefcase } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";

interface LeavesTakenCardProps {
  value: number;
  className?: string;
}

export function LeavesTakenCard({ value, className }: LeavesTakenCardProps) {
  return (
    <KpiCard
      title="Leaves Taken (YTD)"
      value={value}
      subtitle="Working days"
      icon={<Briefcase className="h-4 w-4 text-muted-foreground" />}
      className={className}
    />
  );
}
