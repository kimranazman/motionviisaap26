'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface Initiative {
  id: string
  title: string
  status: string
}

interface InitiativeSelectProps {
  value: string | null
  onValueChange: (initiativeId: string | null) => void
  disabled?: boolean
  // For edit mode: pass initial initiative data to display label before search
  initialInitiative?: { id: string; title: string } | null
}

export function InitiativeSelect({
  value,
  onValueChange,
  disabled = false,
  initialInitiative,
}: InitiativeSelectProps) {
  const [open, setOpen] = useState(false)
  const [initiatives, setInitiatives] = useState<Initiative[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedLabel, setSelectedLabel] = useState<string | null>(
    initialInitiative?.title || null
  )

  // Update selected label when initialInitiative changes
  useEffect(() => {
    if (initialInitiative) {
      setSelectedLabel(initialInitiative.title)
    }
  }, [initialInitiative])

  // Search initiatives as user types
  useEffect(() => {
    if (!query.trim()) {
      setInitiatives([])
      return
    }

    const searchInitiatives = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/initiatives/search?q=${encodeURIComponent(query)}`)
        if (response.ok) {
          const data = await response.json()
          setInitiatives(data)
        }
      } catch (error) {
        console.error('Failed to search initiatives:', error)
      } finally {
        setIsLoading(false)
      }
    }

    const debounce = setTimeout(searchInitiatives, 300)
    return () => clearTimeout(debounce)
  }, [query])

  const handleSelect = (initiative: Initiative) => {
    onValueChange(initiative.id)
    setSelectedLabel(initiative.title)
    setOpen(false)
    setQuery('')
  }

  const handleClear = () => {
    onValueChange(null)
    setSelectedLabel(null)
  }

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              'flex-1 justify-between font-normal',
              !value && 'text-muted-foreground'
            )}
          >
            <span className="truncate">
              {selectedLabel || 'Link to KRI (optional)...'}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[350px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder="Search initiatives..."
            />
            <CommandList>
              {isLoading ? (
                <CommandEmpty>Searching...</CommandEmpty>
              ) : initiatives.length === 0 ? (
                <CommandEmpty>
                  {query ? 'No initiatives found.' : 'Type to search...'}
                </CommandEmpty>
              ) : null}
              <CommandGroup>
                {initiatives.map((initiative) => (
                  <CommandItem
                    key={initiative.id}
                    value={initiative.id}
                    onSelect={() => handleSelect(initiative)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === initiative.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span className="truncate">{initiative.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {value && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClear}
          className="h-9 w-9 shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
