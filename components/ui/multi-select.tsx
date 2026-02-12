"use client"

import * as React from "react"
import { X, ChevronsUpDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"

export interface Option {
  value: string
  label: string
  count?: number
  disabled?: boolean
  /** If true, selecting this option clears all others, and selecting others clears this one. */
  exclusive?: boolean
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
    const clickedOption = options.find((o) => o.value === value)

    if (clickedOption?.exclusive) {
      if (selected.includes(value)) {
        // If already selected, do we allow unselecting? 
        // Usually "Any" is toggleable. If unselected, array becomes empty.
        onChange([])
      } else {
        // Select exclusive, clear others
        onChange([value])
      }
      return
    }

    // If clicking a normal option, remove any exclusive options from selected
    const exclusiveValues = options.filter(o => o.exclusive).map(o => o.value)
    let newSelected = selected.filter(s => !exclusiveValues.includes(s))

    if (newSelected.includes(value)) {
      newSelected = newSelected.filter((s) => s !== value)
    } else {
      newSelected = [...newSelected, value]
    }

    onChange(newSelected)
  }

  const handleClear = () => {
    onChange([])
  }

  const handleRemove = (value: string) => {
    const newSelected = selected.filter((s) => s !== value)
    onChange(newSelected)
  }

  const selectedOptions = options.filter((option) => selected.includes(option.value))

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-xs font-semibold uppercase text-neutral-400">
          {label}
        </label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full h-auto min-h-10 justify-between rounded-sm border border-[#e5e7eb] bg-white px-3 py-2 hover:bg-slate-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-wrap gap-1 items-center max-w-[calc(100%-2rem)]">
              {selected.length > 0 ? (
                selectedOptions.map((option) => (
                  <Badge
                    key={option.value}
                    variant="secondary"
                    className="mr-1 mb-1 font-normal bg-slate-100 text-slate-700 hover:bg-slate-200"
                  >
                    {option.label}
                    <div
                      className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleRemove(option.value)
                        }
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleRemove(option.value)
                      }}
                    >
                      <X className="h-3 w-3 text-slate-500 hover:text-slate-900" />
                    </div>
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground font-normal">
                  {placeholder}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {selected.length > 0 && (
                <div
                  className="rounded-full bg-slate-100 p-1 hover:bg-slate-200 cursor-pointer mr-1"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleClear()
                  }}
                >
                  <X className="h-3 w-3 text-slate-500" />
                </div>
              )}
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
        >
          <Command>
            <CommandInput placeholder="Search options..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-y-auto">
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label} // Use label for filtering or ensure value is handled
                    onSelect={() => handleSelect(option.value)}
                    disabled={option.disabled}
                    className="cursor-pointer"
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        selected.includes(option.value)
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <Check className={cn("h-4 w-4")} />
                    </div>
                    <span>{option.label}</span>
                    {option.count !== undefined && option.count > 0 && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {option.count}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
