import { Briefcase } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";

interface LeavesTakenCardProps {
  value: number;
  availableAllowance?: number;
  className?: string;
}

const UNLIMITED_THRESHOLD = 9999;

export function LeavesTakenCard({ value, availableAllowance, className }: LeavesTakenCardProps) {
  const isUnlimited = availableAllowance !== undefined && availableAllowance >= UNLIMITED_THRESHOLD;
  
  const displayValue = isUnlimited 
    ? value 
    : availableAllowance !== undefined 
      ? `${value} of ${availableAllowance}`
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
