'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Trash2, Plus, UserPlus } from 'lucide-react'
import { CompanyInlineField } from './company-inline-field'
import { IndustryCombobox } from './industry-combobox'
import { ContactCard } from './contact-card'
import { ContactForm } from './contact-form'

interface Contact {
  id: string
  name: string
  email: string | null
  phone: string | null
  role: string | null
  isPrimary: boolean
}

interface Company {
  id: string
  name: string
  industry: string | null
  website: string | null
  address: string | null
  phone: string | null
  notes: string | null
  contacts: Contact[]
  _count: {
    deals: number
    projects: number
    potentials: number
  }
}

interface CompanyDetailModalProps {
  companyId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
  onUpdated: () => void
}

export function CompanyDetailModal({
  companyId,
  open,
  onOpenChange,
  onDeleted,
  onUpdated,
}: CompanyDetailModalProps) {
  const [company, setCompany] = useState<Company | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const fetchCompany = useCallback(async () => {
    if (!companyId) return

    setIsLoading(true)
    setCompany(null)

    try {
      const response = await fetch(`/api/companies/${companyId}`)
      const data = await response.json()
      setCompany(data)
    } catch (error) {
      console.error('Failed to fetch company:', error)
    } finally {
      setIsLoading(false)
    }
  }, [companyId])

  useEffect(() => {
    if (companyId && open) {
      fetchCompany()
      setShowAddForm(false)
    }
  }, [companyId, open, fetchCompany])

  const handleFieldSave = async (field: string, value: string) => {
    if (!company) return

    const response = await fetch(`/api/companies/${company.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    })

    if (response.ok) {
      const updated = await response.json()
      setCompany((prev) => (prev ? { ...prev, ...updated } : null))
      onUpdated()
    } else {
      throw new Error('Failed to update')
    }
  }

  const handleDelete = async () => {
    if (!company) return

    setIsDeleting(true)
    setDeleteError(null)

    try {
      const response = await fetch(`/api/companies/${company.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onDeleted()
      } else {
        const data = await response.json()
        setDeleteError(data.error || 'Failed to delete company')
      }
    } catch {
      setDeleteError('Failed to delete company')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleContactAdded = () => {
    fetchCompany()
    setShowAddForm(false)
    onUpdated()
  }

  const handleContactUpdated = () => {
    fetchCompany()
    onUpdated()
  }

  const handleContactDeleted = () => {
    fetchCompany()
    onUpdated()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        {isLoading ? (
          <CompanyDetailSkeleton />
        ) : company ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">
                <CompanyInlineField
                  value={company.name}
                  onSave={(value) => handleFieldSave('name', value)}
                  placeholder="Company name"
                  className="text-xl font-semibold"
                />
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Company Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">
                    Industry
                  </label>
                  <IndustryCombobox
                    value={company.industry || ''}
                    onValueChange={(value) => handleFieldSave('industry', value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">
                    Website
                  </label>
                  <CompanyInlineField
                    value={company.website || ''}
                    onSave={(value) => handleFieldSave('website', value)}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">
                    Phone
                  </label>
                  <CompanyInlineField
                    value={company.phone || ''}
                    onSave={(value) => handleFieldSave('phone', value)}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">
                    Address
                  </label>
                  <CompanyInlineField
                    value={company.address || ''}
                    onSave={(value) => handleFieldSave('address', value)}
                    placeholder="123 Main St, City, Country"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500">
                  Notes
                </label>
                <CompanyInlineField
                  value={company.notes || ''}
                  onSave={(value) => handleFieldSave('notes', value)}
                  placeholder="Add notes about this company..."
                  multiline
                />
              </div>

              <Separator />

              {/* Contacts Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">
                    Contacts
                    {company.contacts.length > 0 && (
                      <span className="ml-2 text-sm font-normal text-gray-500">
                        ({company.contacts.length})
                      </span>
                    )}
                  </h3>
                  {company.contacts.length > 0 && !showAddForm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddForm(true)}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Add Contact
                    </Button>
                  )}
                </div>

                {/* Add Contact Form */}
                {showAddForm && (
                  <ContactForm
                    companyId={company.id}
                    onSuccess={handleContactAdded}
                    onCancel={() => setShowAddForm(false)}
                  />
                )}

                {/* Contact Cards or Empty State */}
                {company.contacts.length === 0 && !showAddForm ? (
                  <Card className="p-6 text-center">
                    <UserPlus className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 mb-3">
                      No contacts yet
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddForm(true)}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Add your first contact
                    </Button>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {company.contacts.map((contact) => (
                      <ContactCard
                        key={contact.id}
                        contact={contact}
                        companyId={company.id}
                        onUpdate={handleContactUpdated}
                        onDelete={handleContactDeleted}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="flex-row justify-between sm:justify-between">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Company</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete &quot;{company.name}&quot;? This
                      action cannot be undone.
                      {deleteError && (
                        <span className="block mt-2 text-red-600">
                          {deleteError}
                        </span>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete Company'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="py-8 text-center text-gray-500">
            Company not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function CompanyDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Company name */}
      <Skeleton className="h-8 w-64" />

      {/* Company fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-18" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-24 w-full" />
      </div>

      <Separator />

      {/* Contacts section */}
      <Skeleton className="h-5 w-20" />
      <div className="space-y-2">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    </div>
  )
}
