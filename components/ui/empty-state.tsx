import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  className?: string;
  iconClassName?: string;
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
  iconClassName,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-6 px-4" : "py-12 px-4",
        className
      )}
    >
      {Icon && (
        <div
          className={cn(
            "rounded-full bg-muted flex items-center justify-center mb-3",
            compact ? "h-10 w-10" : "h-12 w-12",
            iconClassName
          )}
        >
          <Icon
            className={cn(
              "text-muted-foreground",
              compact ? "h-5 w-5" : "h-6 w-6"
            )}
          />
        </div>
      )}
      <h3
        className={cn(
          "font-medium text-neutral-900",
          compact ? "text-sm" : "text-base"
        )}
      >
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            "text-neutral-400 mt-1",
            compact ? "text-xs" : "text-sm"
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
