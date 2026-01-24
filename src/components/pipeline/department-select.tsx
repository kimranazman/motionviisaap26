'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown, Building } from 'lucide-react'
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

interface Department {
  id: string
  name: string
}

interface DepartmentSelectProps {
  value: string | null
  onValueChange: (departmentId: string | null) => void
  departments: Department[]
  disabled?: boolean
}

export function DepartmentSelect({
  value,
  onValueChange,
  departments,
  disabled = false,
}: DepartmentSelectProps) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const selectedDepartment = departments.find((d) => d.id === value)
  const isEmpty = departments.length === 0

  const filteredDepartments = departments.filter((dept) =>
    dept.name.toLowerCase().includes(inputValue.toLowerCase())
  )

  const handleSelect = (departmentId: string) => {
    onValueChange(departmentId === value ? null : departmentId)
    setOpen(false)
    setInputValue('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || isEmpty}
          className={cn(
            'w-full justify-between font-normal',
            !value && 'text-muted-foreground'
          )}
        >
          {isEmpty
            ? '(No departments)'
            : selectedDepartment?.name || 'Select department...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            value={inputValue}
            onValueChange={setInputValue}
            placeholder="Search department..."
          />
          <CommandList>
            {filteredDepartments.length === 0 ? (
              <CommandEmpty>No departments found.</CommandEmpty>
            ) : null}
            <CommandGroup>
              {filteredDepartments.map((dept) => (
                <CommandItem
                  key={dept.id}
                  value={dept.id}
                  onSelect={() => handleSelect(dept.id)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === dept.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <Building className="mr-2 h-4 w-4 text-gray-400" />
                  {dept.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
