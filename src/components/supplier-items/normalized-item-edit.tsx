'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Check, X, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NormalizedItemEditProps {
  costId: string
  value: string | null
  onUpdate: (newValue: string) => void
}

export function NormalizedItemEdit({
  costId,
  value,
  onUpdate,
}: NormalizedItemEditProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value || '')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    const trimmedValue = editValue.trim()
    if (!trimmedValue) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/costs/${costId}/normalize`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ normalizedItem: trimmedValue }),
      })

      if (response.ok) {
        onUpdate(trimmedValue)
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Error updating normalized item:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditValue(value || '')
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-8 text-sm"
          autoFocus
          disabled={isSaving}
        />
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
          onClick={handleSave}
          disabled={isSaving || !editValue.trim()}
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-gray-500 hover:text-gray-700"
          onClick={handleCancel}
          disabled={isSaving}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'group flex items-center gap-2 cursor-pointer rounded px-2 py-1 -mx-2',
        'hover:bg-gray-100 transition-colors'
      )}
      onClick={() => {
        setEditValue(value || '')
        setIsEditing(true)
      }}
    >
      <span className={cn('text-sm', !value && 'text-gray-400 italic')}>
        {value || 'Not categorized'}
      </span>
      <Pencil className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  )
}
