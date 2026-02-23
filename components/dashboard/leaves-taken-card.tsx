import { Briefcase } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";

interface LeavesTakenCardProps {
  value: number;
  totalAllowance?: number;
  className?: string;
}

const UNLIMITED_THRESHOLD = 9999;

export function LeavesTakenCard({ value, totalAllowance, className }: LeavesTakenCardProps) {
  const isUnlimited = totalAllowance !== undefined && totalAllowance >= UNLIMITED_THRESHOLD;
  
  const displayValue = isUnlimited 
    ? value 
    : totalAllowance !== undefined 
      ? `${value} of ${totalAllowance}`
      : value;
      
  const subtitle = isUnlimited ? "days (unlimited)" : "days";

  return (
    <KpiCard
      title="Leaves Taken (YTD)"
      value={displayValue}
      subtitle={subtitle}
      icon={<Briefcase className="h-4 w-4 text-muted-foreground" />}
      className={className}
    />
  );
}
