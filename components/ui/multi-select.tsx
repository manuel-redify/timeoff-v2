"use client"

import * as React from "react"
import { X, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"

interface Option {
  value: string
  label: string
  count?: number
  disabled?: boolean
}

interface MultiSelectProps {
  options: Option[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  label?: string
  className?: string
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select...",
  label,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((s) => s !== value)
      : [...selected, value]
    onChange(newSelected)
  }

  const handleClear = () => {
    onChange([])
  }

  const selectedLabels = options
    .filter((option) => selected.includes(option.value))
    .map((option) => option.label)

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          {label}
        </label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full h-10 justify-between rounded-sm border border-[#e5e7eb] bg-white px-3 py-2 text-sm font-normal hover:bg-slate-50"
          >
            <span className="truncate text-left">
              {selected.length > 0
                ? selectedLabels.join(", ")
                : placeholder}
            </span>
            <div className="flex items-center gap-1">
              {selected.length > 0 && (
                <span
                  className="size-5 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleClear()
                  }}
                >
                  <X className="size-3" />
                </span>
              )}
              <ChevronDown className="size-4 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-2 rounded-sm border border-[#e5e7eb]" align="start">
          <div className="max-h-60 overflow-y-auto">
            {options.length === 0 ? (
              <p className="text-sm text-slate-500 p-2">No options available</p>
            ) : (
              options.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    "flex items-center space-x-2 p-2 rounded-sm",
                    option.disabled 
                      ? "opacity-50 cursor-not-allowed" 
                      : "hover:bg-slate-50 cursor-pointer"
                  )}
                  onClick={() => !option.disabled && handleSelect(option.value)}
                >
                  <Checkbox
                    checked={selected.includes(option.value)}
                    id={`option-${option.value}`}
                    onCheckedChange={() => !option.disabled && handleSelect(option.value)}
                    disabled={option.disabled}
                  />
                  <label
                    htmlFor={`option-${option.value}`}
                    className={cn(
                      "text-sm font-medium flex-1",
                      option.disabled ? "text-slate-400 cursor-not-allowed" : "text-slate-700 cursor-pointer"
                    )}
                  >
                    {option.label}
                    {option.count !== undefined && option.count > 0 && (
                      <span className="ml-2 text-xs text-slate-400">
                        ({option.count})
                      </span>
                    )}
                  </label>
                </div>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
