'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface CompanyInlineFieldProps {
  value: string
  onSave: (value: string) => Promise<void>
  placeholder?: string
  multiline?: boolean
  className?: string
}

export function CompanyInlineField({
  value,
  onSave,
  placeholder,
  multiline = false,
  className,
}: CompanyInlineFieldProps) {
  const [editingValue, setEditingValue] = useState(value)
  const [isSaving, setIsSaving] = useState(false)
  const [hasError, setHasError] = useState(false)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  // Sync with external value changes
  useEffect(() => {
    setEditingValue(value)
  }, [value])

  const handleBlur = async () => {
    if (editingValue.trim() === value.trim()) return // No change

    setIsSaving(true)
    setHasError(false)

    try {
      await onSave(editingValue.trim())
    } catch {
      setEditingValue(value) // Rollback on error
      setHasError(true)
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault()
      ;(e.currentTarget as HTMLElement).blur()
    }
    if (e.key === 'Escape') {
      setEditingValue(value)
      ;(e.currentTarget as HTMLElement).blur()
    }
  }

  const baseClassName = cn(
    'w-full bg-transparent border-0 rounded px-2 py-2 -mx-2 min-h-[44px]',
    'focus:border focus:border-input focus:ring-1 focus:ring-ring focus:bg-background',
    'hover:bg-muted/50 transition-colors',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    hasError && 'ring-1 ring-red-500',
    className
  )

  if (multiline) {
    return (
      <div className="relative">
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={editingValue}
          onChange={(e) => setEditingValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isSaving}
          rows={3}
          className={cn(baseClassName, 'resize-none min-h-[80px]')}
        />
        {isSaving && (
          <div className="absolute right-2 top-2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={editingValue}
        onChange={(e) => setEditingValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isSaving}
        className={baseClassName}
      />
      {isSaving && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        </div>
      )}
    </div>
  )
}
