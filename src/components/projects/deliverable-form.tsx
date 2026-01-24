'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'

interface Deliverable {
  id: string
  title: string
  description: string | null
  value: number | null
}

interface DeliverableFormProps {
  projectId: string
  deliverable?: Deliverable
  onSuccess: () => void
  onCancel: () => void
}

export function DeliverableForm({
  projectId,
  deliverable,
  onSuccess,
  onCancel,
}: DeliverableFormProps) {
  const [title, setTitle] = useState(deliverable?.title || '')
  const [description, setDescription] = useState(deliverable?.description || '')
  const [value, setValue] = useState(deliverable?.value?.toString() || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Client-side validation
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    setIsSubmitting(true)

    try {
      const url = deliverable
        ? `/api/projects/${projectId}/deliverables/${deliverable.id}`
        : `/api/projects/${projectId}/deliverables`

      const response = await fetch(url, {
        method: deliverable ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          value: value ? parseFloat(value) : null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to save deliverable')
        return
      }

      onSuccess()
    } catch (err) {
      console.error('Failed to save deliverable:', err)
      setError('Failed to save deliverable')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-gray-50">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="deliverable-title">
          Title <span className="text-red-500">*</span>
        </Label>
        <Input
          id="deliverable-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Event Production Services"
          autoFocus
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="deliverable-description">Description</Label>
        <Textarea
          id="deliverable-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional details about this deliverable..."
          className="min-h-[60px]"
        />
      </div>

      {/* Value */}
      <div className="space-y-2">
        <Label htmlFor="deliverable-value">Value (RM)</Label>
        <Input
          id="deliverable-value"
          type="number"
          step="0.01"
          min="0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="0.00"
        />
      </div>

      {/* Error message */}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel} className="w-full sm:w-auto">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {deliverable ? 'Update' : 'Add'} Deliverable
        </Button>
      </div>
    </form>
  )
}
