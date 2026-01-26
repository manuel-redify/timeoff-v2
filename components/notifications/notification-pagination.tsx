'use client'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Loader2, SkipBack, SkipForward } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  loading: boolean
  onPageChange: (page: number) => void
  onItemsPerPageChange: (size: number) => void
  hasNext: boolean
  hasPrevious: boolean
}

const itemsPerPageOptions = [10, 20, 50, 100]

export function NotificationPaginationControls({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  loading,
  onPageChange,
  onItemsPerPageChange,
  hasNext,
  hasPrevious
}: PaginationControlsProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages && !loading) {
      onPageChange(page)
    }
  }

  const goToPrevious = () => {
    if (hasPrevious && !loading) {
      goToPage(currentPage - 1)
    }
  }

  const goToNext = () => {
    if (hasNext && !loading) {
      goToPage(currentPage + 1)
    }
  }

  const goToFirst = () => {
    goToPage(1)
  }

  const goToLast = () => {
    goToPage(totalPages)
  }

  // Generate page numbers for quick navigation
  const getVisiblePages = () => {
    const pages: (number | string)[] = []
    const maxVisible = 7
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)
      
      // Show pages around current page
      const start = Math.max(2, currentPage - 2)
      const end = Math.min(totalPages - 1, currentPage + 2)
      
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i)
        }
      }
      
      // Show ellipsis if needed
      if (start > 2 && !pages.includes(start - 1)) {
        pages.splice(1, 1, '...')
      }
      
      if (end < totalPages - 1 && !pages.includes(end + 1)) {
        pages.push('...')
      }
      
      // Always show last page
      if (!pages.includes(totalPages)) {
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t bg-gray-50">
      {/* Results Summary */}
      <div className="text-sm text-gray-600">
        Showing {startItem}-{endItem} of {totalItems} notifications
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-4">
        {/* Items per page */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Show</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => onItemsPerPageChange(parseInt(value))}
            disabled={loading}
          >
            <SelectTrigger className="w-16 h-8">
              <SelectValue placeholder="20" />
            </SelectTrigger>
            <SelectContent>
              {itemsPerPageOptions.map(size => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-1">
          {/* First Page */}
          <Button
            variant="ghost"
            size="sm"
            onClick={goToFirst}
            disabled={loading || currentPage === 1}
            className="h-8 w-8 p-0"
          >
            <SkipBack className="h-3 w-3" />
          </Button>

          {/* Previous Page */}
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPrevious}
            disabled={loading || !hasPrevious}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {getVisiblePages().map((page, index) => (
              <div key={typeof page === 'number' ? page : index}>
                {typeof page === 'number' ? (
                  <Button
                    variant={page === currentPage ? "default" : "ghost"}
                    size="sm"
                    onClick={() => goToPage(page)}
                    disabled={loading}
                    className={cn(
                      "h-8 w-8 p-0 text-xs",
                      page === currentPage && "ring-2 ring-primary"
                    )}
                  >
                    {page}
                  </Button>
                ) : (
                  <div className="h-8 w-8 flex items-center justify-center text-xs text-gray-400">
                    ...
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Next Page */}
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNext}
            disabled={loading || !hasNext}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-3 w-3" />
          </Button>

          {/* Last Page */}
          <Button
            variant="ghost"
            size="sm"
            onClick={goToLast}
            disabled={loading || currentPage === totalPages}
            className="h-8 w-8 p-0"
          >
            <SkipForward className="h-3 w-3" />
          </Button>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        )}
      </div>

      {/* Current Page Info */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          Page {currentPage} of {totalPages}
        </Badge>
      </div>
    </div>
  )
}