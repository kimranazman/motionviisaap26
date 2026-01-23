'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { format } from 'date-fns'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CostCategory {
  id: string
  name: string
  description: string | null
}

interface Cost {
  id: string
  description: string
  amount: number
  categoryId: string
  date: string
}

interface CostFormProps {
  projectId: string
  cost?: Cost
  categories: CostCategory[]
  onSuccess: () => void
  onCancel: () => void
}

export function CostForm({
  projectId,
  cost,
  categories,
  onSuccess,
  onCancel,
}: CostFormProps) {
  const [description, setDescription] = useState(cost?.description || '')
  const [amount, setAmount] = useState(cost?.amount?.toString() || '')
  const [categoryId, setCategoryId] = useState(cost?.categoryId || '')
  const [date, setDate] = useState<Date>(
    cost?.date ? new Date(cost.date) : new Date()
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Client-side validation
    if (!description.trim()) {
      setError('Description is required')
      return
    }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) < 0) {
      setError('Valid amount is required')
      return
    }
    if (!categoryId) {
      setError('Category is required')
      return
    }

    setIsSubmitting(true)

    try {
      const url = cost
        ? `/api/projects/${projectId}/costs/${cost.id}`
        : `/api/projects/${projectId}/costs`

      const response = await fetch(url, {
        method: cost ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(),
          amount: parseFloat(amount),
          categoryId,
          date: date.toISOString(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to save cost')
        return
      }

      onSuccess()
    } catch (err) {
      console.error('Failed to save cost:', err)
      setError('Failed to save cost')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-gray-50">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Description */}
        <div className="col-span-2 space-y-2">
          <Label htmlFor="cost-description">
            Description <span className="text-red-500">*</span>
          </Label>
          <Input
            id="cost-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Venue rental deposit"
            autoFocus
          />
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <Label htmlFor="cost-amount">
            Amount (RM) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="cost-amount"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label>
            Category <span className="text-red-500">*</span>
          </Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date */}
        <div className="space-y-2">
          <Label>Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal h-11 md:h-10',
                  !date && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
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
          {cost ? 'Update' : 'Add'} Cost
        </Button>
      </div>
    </form>
  )
}
