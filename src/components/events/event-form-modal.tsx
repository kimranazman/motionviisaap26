'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

interface EventToAttend {
  id: string
  priority: string
  name: string
  category: string
  eventDate: string
  location: string
  estimatedCost: number | null
  whyAttend: string | null
  targetCompanies: string | null
  actionRequired: string | null
  status: string
  remarks: string | null
}

interface EventFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  event?: EventToAttend | null
}

export function EventFormModal({
  open,
  onOpenChange,
  onSuccess,
  event,
}: EventFormModalProps) {
  const isEditing = !!event

  const [name, setName] = useState('')
  const [priority, setPriority] = useState('TIER_1')
  const [category, setCategory] = useState('EVENTS')
  const [eventDate, setEventDate] = useState('')
  const [location, setLocation] = useState('')
  const [estimatedCost, setEstimatedCost] = useState('')
  const [whyAttend, setWhyAttend] = useState('')
  const [targetCompanies, setTargetCompanies] = useState('')
  const [actionRequired, setActionRequired] = useState('')
  const [status, setStatus] = useState('PLANNED')
  const [remarks, setRemarks] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset or populate form when modal opens/closes or event changes
  useEffect(() => {
    if (open && event) {
      // Edit mode: populate fields
      setName(event.name)
      setPriority(event.priority)
      setCategory(event.category)
      setEventDate(event.eventDate)
      setLocation(event.location)
      setEstimatedCost(event.estimatedCost ? String(event.estimatedCost) : '')
      setWhyAttend(event.whyAttend || '')
      setTargetCompanies(event.targetCompanies || '')
      setActionRequired(event.actionRequired || '')
      setStatus(event.status)
      setRemarks(event.remarks || '')
    } else if (open && !event) {
      // Create mode: reset fields
      setName('')
      setPriority('TIER_1')
      setCategory('EVENTS')
      setEventDate('')
      setLocation('')
      setEstimatedCost('')
      setWhyAttend('')
      setTargetCompanies('')
      setActionRequired('')
      setStatus('PLANNED')
      setRemarks('')
    }
    setError(null)
  }, [open, event])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate required fields
    if (!name.trim()) {
      setError('Event name is required')
      return
    }
    if (!eventDate.trim()) {
      setError('Event date is required')
      return
    }
    if (!location.trim()) {
      setError('Location is required')
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        name: name.trim(),
        priority,
        category,
        eventDate: eventDate.trim(),
        location: location.trim(),
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null,
        whyAttend: whyAttend.trim() || null,
        targetCompanies: targetCompanies.trim() || null,
        actionRequired: actionRequired.trim() || null,
        status,
        remarks: remarks.trim() || null,
      }

      const url = isEditing
        ? `/api/events-to-attend/${event.id}`
        : '/api/events-to-attend'
      const method = isEditing ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || `Failed to ${isEditing ? 'update' : 'create'} event`)
        return
      }

      onSuccess()
      onOpenChange(false)
    } catch (err) {
      console.error(`Failed to ${isEditing ? 'update' : 'create'} event:`, err)
      setError(`Failed to ${isEditing ? 'update' : 'create'} event`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Event' : 'New Event'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="event-name">
                Event Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="event-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter event name"
                autoFocus
              />
            </div>

            {/* Priority & Category (2 columns) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Priority <span className="text-red-500">*</span>
                </Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TIER_1">Tier 1</SelectItem>
                    <SelectItem value="TIER_2">Tier 2</SelectItem>
                    <SelectItem value="TIER_3">Tier 3</SelectItem>
                    <SelectItem value="ENERGY">Energy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  Category <span className="text-red-500">*</span>
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EVENTS">Events</SelectItem>
                    <SelectItem value="AI_TRAINING">AI Training</SelectItem>
                    <SelectItem value="BOTH">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date & Location (2 columns) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event-date">
                  Event Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="event-date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  placeholder="e.g. 15-17 Mar 2026"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="event-location">
                  Location <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="event-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. KLCC, Kuala Lumpur"
                />
              </div>
            </div>

            {/* Estimated Cost & Status (2 columns) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event-cost">Estimated Cost</Label>
                <CurrencyInput
                  id="event-cost"
                  value={estimatedCost}
                  onChange={setEstimatedCost}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLANNED">Planned</SelectItem>
                    <SelectItem value="REGISTERED">Registered</SelectItem>
                    <SelectItem value="ATTENDED">Attended</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    <SelectItem value="SKIPPED">Skipped</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Why Attend */}
            <div className="space-y-2">
              <Label htmlFor="event-why">Why Attend</Label>
              <Textarea
                id="event-why"
                value={whyAttend}
                onChange={(e) => setWhyAttend(e.target.value)}
                placeholder="Reason for attending this event..."
                className="min-h-[60px]"
              />
            </div>

            {/* Target Companies */}
            <div className="space-y-2">
              <Label htmlFor="event-targets">Target Companies</Label>
              <Textarea
                id="event-targets"
                value={targetCompanies}
                onChange={(e) => setTargetCompanies(e.target.value)}
                placeholder="Companies to connect with..."
                className="min-h-[60px]"
              />
            </div>

            {/* Action Required */}
            <div className="space-y-2">
              <Label htmlFor="event-action">Action Required</Label>
              <Input
                id="event-action"
                value={actionRequired}
                onChange={(e) => setActionRequired(e.target.value)}
                placeholder="e.g. Register by Feb 2026"
              />
            </div>

            {/* Remarks */}
            <div className="space-y-2">
              <Label htmlFor="event-remarks">Remarks</Label>
              <Textarea
                id="event-remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Additional notes..."
                className="min-h-[60px]"
              />
            </div>

            {/* Error message */}
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEditing ? 'Save Changes' : 'Create Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
