'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
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
import { INDUSTRY_PRESETS } from '@/lib/industry-presets'

interface IndustryComboboxProps {
  value: string
  onValueChange: (value: string) => void
}

export function IndustryCombobox({ value, onValueChange }: IndustryComboboxProps) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const filteredPresets = INDUSTRY_PRESETS.filter((industry) =>
    industry.toLowerCase().includes(inputValue.toLowerCase())
  )

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue)
    setOpen(false)
    setInputValue('')
  }

  const handleUseCustom = () => {
    if (inputValue.trim()) {
      onValueChange(inputValue.trim())
      setOpen(false)
      setInputValue('')
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between font-normal',
            !value && 'text-muted-foreground'
          )}
        >
          {value || 'Select industry...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            value={inputValue}
            onValueChange={setInputValue}
            placeholder="Search or type..."
          />
          <CommandList>
            {filteredPresets.length === 0 && inputValue.trim() ? (
              <CommandEmpty className="py-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={handleUseCustom}
                >
                  Use &quot;{inputValue}&quot;
                </Button>
              </CommandEmpty>
            ) : filteredPresets.length === 0 ? (
              <CommandEmpty>No industries found.</CommandEmpty>
            ) : null}
            <CommandGroup>
              {filteredPresets.map((industry) => (
                <CommandItem
                  key={industry}
                  value={industry}
                  onSelect={() => handleSelect(industry)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === industry ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {industry}
                </CommandItem>
              ))}
              {inputValue.trim() &&
                !filteredPresets.some(
                  (p) => p.toLowerCase() === inputValue.toLowerCase()
                ) && (
                  <CommandItem
                    value={inputValue}
                    onSelect={handleUseCustom}
                    className="text-muted-foreground"
                  >
                    <Check className="mr-2 h-4 w-4 opacity-0" />
                    Use &quot;{inputValue}&quot;
                  </CommandItem>
                )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
