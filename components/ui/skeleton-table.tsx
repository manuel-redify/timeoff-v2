import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface SkeletonTableProps {
  className?: string
  columns?: number
  rows?: number
  showHeader?: boolean
  showActions?: boolean
}

export function SkeletonTable({
  className,
  columns = 5,
  rows = 5,
  showHeader = true,
  showActions = true,
}: SkeletonTableProps) {
  return (
    <div className={cn("relative w-full overflow-x-auto", className)}>
      <Table>
        {showHeader && (
          <TableHeader>
            <TableRow>
              {Array.from({ length: columns }).map((_, i) => (
                <TableHead key={i}>
                  <Skeleton className="h-4 w-20" />
                </TableHead>
              ))}
              {showActions && <TableHead />}
            </TableRow>
          </TableHeader>
        )}
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <TableCell key={colIndex}>
                  <Skeleton 
                    className={cn(
                      "h-4",
                      colIndex === 0 ? "w-32" : "w-24"
                    )} 
                  />
                </TableCell>
              ))}
              {showActions && (
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

interface SkeletonTableRowProps {
  columns?: number
  showActions?: boolean
}

export function SkeletonTableRow({
  columns = 5,
  showActions = true,
}: SkeletonTableRowProps) {
  return (
    <TableRow>
      {Array.from({ length: columns }).map((_, colIndex) => (
        <TableCell key={colIndex}>
          <Skeleton 
            className={cn(
              "h-4",
              colIndex === 0 ? "w-32" : "w-24"
            )} 
          />
        </TableCell>
      ))}
      {showActions && (
        <TableCell>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </TableCell>
      )}
    </TableRow>
  )
}
