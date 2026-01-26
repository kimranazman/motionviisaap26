'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface CurrencyInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
}

export function CurrencyInput({
  value,
  onChange,
  placeholder = '0',
  disabled = false,
  className,
  id,
}: CurrencyInputProps) {
  const [isFocused, setIsFocused] = useState(false)

  const formatDisplay = (raw: string): string => {
    if (!raw) return ''
    const num = parseFloat(raw)
    if (isNaN(num)) return ''
    return new Intl.NumberFormat('en-MY', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^0-9.]/g, '')
    // Prevent multiple decimal points
    const parts = cleaned.split('.')
    const sanitized = parts.length > 2
      ? parts[0] + '.' + parts.slice(1).join('')
      : cleaned
    onChange(sanitized)
  }

  const displayValue = isFocused ? value : formatDisplay(value)

  return (
    <div className="relative">
      {!isFocused && value && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
          RM
        </span>
      )}
      <Input
        id={id}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          !isFocused && value ? 'pl-10' : '',
          disabled && 'bg-gray-50 cursor-not-allowed',
          className
        )}
      />
    </div>
  )
}
