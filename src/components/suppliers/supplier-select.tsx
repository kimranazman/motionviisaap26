'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown, Truck, X } from 'lucide-react'
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

interface Supplier {
  id: string
  name: string
}

interface SupplierSelectProps {
  value: string | null
  onValueChange: (supplierId: string | null) => void
  disabled?: boolean
}

export function SupplierSelect({
  value,
  onValueChange,
  disabled = false,
}: SupplierSelectProps) {
  const [open, setOpen] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const fetchSuppliers = async () => {
    if (hasFetched) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/suppliers')
      if (response.ok) {
        const data = await response.json()
        setSuppliers(data)
      }
    } catch (error) {
      console.error('Failed to fetch suppliers:', error)
    } finally {
      setIsLoading(false)
      setHasFetched(true)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      fetchSuppliers()
    }
  }

  const selectedSupplier = suppliers.find((s) => s.id === value)

  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.name.toLowerCase().includes(inputValue.toLowerCase())
  )

  const handleSelect = (supplierId: string) => {
    onValueChange(supplierId === value ? null : supplierId)
    setOpen(false)
    setInputValue('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onValueChange(null)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal h-11 md:h-10',
            !value && 'text-muted-foreground'
          )}
        >
          <div className="flex items-center gap-2 truncate">
            {value && selectedSupplier ? (
              <>
                <Truck className="h-4 w-4 shrink-0 text-gray-500" />
                <span className="truncate">{selectedSupplier.name}</span>
              </>
            ) : isLoading ? (
              'Loading...'
            ) : (
              'Select supplier (optional)'
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {value && (
              <X
                className="h-4 w-4 text-gray-400 hover:text-gray-600"
                onClick={handleClear}
              />
            )}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            value={inputValue}
            onValueChange={setInputValue}
            placeholder="Search supplier..."
          />
          <CommandList>
            {isLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Loading suppliers...
              </div>
            ) : filteredSuppliers.length === 0 ? (
              <CommandEmpty>No suppliers found.</CommandEmpty>
            ) : null}
            {!isLoading && (
              <CommandGroup>
                {filteredSuppliers.map((supplier) => (
                  <CommandItem
                    key={supplier.id}
                    value={supplier.id}
                    onSelect={() => handleSelect(supplier.id)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === supplier.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <Truck className="mr-2 h-4 w-4 text-gray-500" />
                    {supplier.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
