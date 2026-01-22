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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { CompanySelect } from '@/components/pipeline/company-select'
import { ContactSelect } from '@/components/pipeline/contact-select'

interface Contact {
  id: string
  name: string
}

interface PotentialProject {
  id: string
  title: string
  description: string | null
  estimatedValue: number | null
  stage: string
  position: number
  company: { id: string; name: string } | null
  contact: { id: string; name: string } | null
}

interface PotentialFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (project: PotentialProject) => void
}

export function PotentialFormModal({
  open,
  onOpenChange,
  onSuccess,
}: PotentialFormModalProps) {
  const [title, setTitle] = useState('')
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [contactId, setContactId] = useState<string | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [estimatedValue, setEstimatedValue] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingContacts, setIsLoadingContacts] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setTitle('')
      setCompanyId(null)
      setContactId(null)
      setContacts([])
      setEstimatedValue('')
      setDescription('')
      setError(null)
    }
  }, [open])

  // Fetch contacts when company changes
  useEffect(() => {
    if (!companyId) {
      setContacts([])
      setContactId(null)
      return
    }

    const fetchContacts = async () => {
      setIsLoadingContacts(true)
      setContactId(null) // Clear contact when company changes
      try {
        const response = await fetch(`/api/companies/${companyId}`)
        if (response.ok) {
          const data = await response.json()
          setContacts(data.contacts || [])
        }
      } catch (error) {
        console.error('Failed to fetch contacts:', error)
        setContacts([])
      } finally {
        setIsLoadingContacts(false)
      }
    }
    fetchContacts()
  }, [companyId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate required fields
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    if (!companyId) {
      setError('Company is required')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/potential-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          companyId,
          contactId: contactId || null,
          estimatedValue: estimatedValue ? parseFloat(estimatedValue) : null,
          description: description.trim() || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to create project')
        return
      }

      const project = await response.json()
      onSuccess(project)
      onOpenChange(false)
    } catch (err) {
      console.error('Failed to create project:', err)
      setError('Failed to create project')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Potential Project</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter project title"
                autoFocus
              />
            </div>

            {/* Company */}
            <div className="space-y-2">
              <Label>
                Company <span className="text-red-500">*</span>
              </Label>
              <CompanySelect
                value={companyId}
                onValueChange={setCompanyId}
              />
            </div>

            {/* Contact */}
            <div className="space-y-2">
              <Label>Contact</Label>
              <ContactSelect
                value={contactId}
                onValueChange={setContactId}
                contacts={contacts}
                disabled={!companyId || isLoadingContacts}
              />
              {isLoadingContacts && (
                <p className="text-xs text-muted-foreground">
                  Loading contacts...
                </p>
              )}
            </div>

            {/* Estimated Value */}
            <div className="space-y-2">
              <Label htmlFor="estimatedValue">Estimated Value</Label>
              <Input
                id="estimatedValue"
                type="number"
                step="0.01"
                min="0"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
                placeholder="0.00"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add notes about this project..."
                className="min-h-[80px]"
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
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
