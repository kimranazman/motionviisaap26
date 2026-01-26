'use client'

import { useState, useEffect, useMemo } from 'react'
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
import { Loader2 } from 'lucide-react'
import { CompanySelect } from './company-select'
import { ContactSelect } from './contact-select'
import { DepartmentSelect } from './department-select'

interface Department {
  id: string
  name: string
}

interface Contact {
  id: string
  name: string
  departmentId: string | null
}

interface Deal {
  id: string
  title: string
  description: string | null
  value: number | null
  stage: string
  position: number
  company: { id: string; name: string } | null
  contact: { id: string; name: string } | null
}

interface DealFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (deal: Deal) => void
}

export function DealFormModal({
  open,
  onOpenChange,
  onSuccess,
}: DealFormModalProps) {
  const [title, setTitle] = useState('')
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [departmentId, setDepartmentId] = useState<string | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [contactId, setContactId] = useState<string | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [value, setValue] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingContacts, setIsLoadingContacts] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setTitle('')
      setCompanyId(null)
      setDepartmentId(null)
      setDepartments([])
      setContactId(null)
      setContacts([])
      setValue('')
      setDescription('')
      setError(null)
    }
  }, [open])

  // Fetch contacts and departments when company changes
  useEffect(() => {
    if (!companyId) {
      setContacts([])
      setDepartments([])
      setContactId(null)
      setDepartmentId(null)
      return
    }

    const fetchCompanyData = async () => {
      setIsLoadingContacts(true)
      setContactId(null) // Clear contact when company changes
      setDepartmentId(null) // Clear department when company changes
      try {
        const response = await fetch(`/api/companies/${companyId}`)
        if (response.ok) {
          const data = await response.json()
          setContacts(data.contacts || [])
          setDepartments(data.departments || [])
        }
      } catch (error) {
        console.error('Failed to fetch company data:', error)
        setContacts([])
        setDepartments([])
      } finally {
        setIsLoadingContacts(false)
      }
    }
    fetchCompanyData()
  }, [companyId])

  // Filter contacts by department
  const filteredContacts = useMemo(() => {
    if (!departmentId) return contacts // No filter when no department selected
    return contacts.filter(
      (c) => c.departmentId === departmentId || c.departmentId === null
    )
  }, [contacts, departmentId])

  // Clear contact if not in filtered list when department changes
  useEffect(() => {
    if (contactId && departmentId) {
      const isValidContact = filteredContacts.some((c) => c.id === contactId)
      if (!isValidContact) {
        setContactId(null)
      }
    }
  }, [departmentId, filteredContacts, contactId])

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
      const response = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          companyId,
          departmentId: departmentId || null,
          contactId: contactId || null,
          value: value ? parseFloat(value) : null,
          description: description.trim() || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to create deal')
        return
      }

      const deal = await response.json()
      onSuccess(deal)
      onOpenChange(false)
    } catch (err) {
      console.error('Failed to create deal:', err)
      setError('Failed to create deal')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Deal</DialogTitle>
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
                placeholder="Enter deal title"
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

            {/* Department */}
            <div className="space-y-2">
              <Label>Department</Label>
              <DepartmentSelect
                value={departmentId}
                onValueChange={setDepartmentId}
                departments={departments}
                disabled={!companyId || isLoadingContacts}
              />
              {!companyId && (
                <p className="text-xs text-muted-foreground">
                  Select a company first
                </p>
              )}
            </div>

            {/* Contact */}
            <div className="space-y-2">
              <Label>Contact</Label>
              <ContactSelect
                value={contactId}
                onValueChange={setContactId}
                contacts={filteredContacts}
                disabled={!companyId || isLoadingContacts}
              />
              {isLoadingContacts && (
                <p className="text-xs text-muted-foreground">
                  Loading contacts...
                </p>
              )}
            </div>

            {/* Value */}
            <div className="space-y-2">
              <Label htmlFor="value">Value</Label>
              <CurrencyInput
                id="value"
                value={value}
                onChange={setValue}
                placeholder="0"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add notes about this deal..."
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
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Deal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
