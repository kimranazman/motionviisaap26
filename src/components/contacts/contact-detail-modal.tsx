'use client'

import { useEffect, useState, useCallback } from 'react'
import { DetailView } from '@/components/ui/detail-view'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { Trash2, Building2, Building, Star } from 'lucide-react'
import { CompanyInlineField } from '@/components/companies/company-inline-field'
import { formatDealStage, getStageColor } from '@/lib/pipeline-utils'
import { formatPotentialStage, getPotentialStageColor } from '@/lib/potential-utils'
import { formatProjectStatus, getProjectStatusColor } from '@/lib/project-utils'

interface RelatedDeal {
  id: string
  title: string
  stage: string
  value: number | null
}

interface RelatedPotential {
  id: string
  title: string
  stage: string
  estimatedValue: number | null
}

interface RelatedProject {
  id: string
  title: string
  status: string
  revenue: number | null
}

interface ContactFull {
  id: string
  name: string
  email: string | null
  phone: string | null
  role: string | null
  isPrimary: boolean
  company: { id: string; name: string }
  department: { id: string; name: string } | null
  deals: RelatedDeal[]
  potentials: RelatedPotential[]
  projects: RelatedProject[]
}

interface ContactDetailModalProps {
  contactId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
  onUpdated: () => void
}

export function ContactDetailModal({
  contactId,
  open,
  onOpenChange,
  onDeleted,
  onUpdated,
}: ContactDetailModalProps) {
  const [contact, setContact] = useState<ContactFull | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const fetchContact = useCallback(async () => {
    if (!contactId) return

    setIsLoading(true)
    setContact(null)

    try {
      const response = await fetch(`/api/contacts/${contactId}`)
      if (response.ok) {
        const data = await response.json()
        setContact(data)
      }
    } catch (error) {
      console.error('Failed to fetch contact:', error)
    } finally {
      setIsLoading(false)
    }
  }, [contactId])

  useEffect(() => {
    if (contactId && open) {
      fetchContact()
    }
  }, [contactId, open, fetchContact])

  const handleFieldSave = async (field: string, value: string) => {
    if (!contact) return

    const response = await fetch(`/api/contacts/${contact.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    })

    if (response.ok) {
      await fetchContact()
      onUpdated()
    } else {
      throw new Error('Failed to update')
    }
  }

  const handleDelete = async () => {
    if (!contact) return

    setIsDeleting(true)
    setDeleteError(null)

    try {
      const response = await fetch(`/api/contacts/${contact.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onDeleted()
      } else {
        const data = await response.json()
        setDeleteError(data.error || 'Failed to delete contact')
      }
    } catch {
      setDeleteError('Failed to delete contact')
    } finally {
      setIsDeleting(false)
    }
  }

  const footerContent = contact ? (
    <div className="flex-row flex justify-between sm:justify-between w-full">
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
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{contact.name}&quot;? This
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
              {isDeleting ? 'Deleting...' : 'Delete Contact'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
        Close
      </Button>
    </div>
  ) : undefined

  return (
    <DetailView
      open={open}
      onOpenChange={onOpenChange}
      title={
        contact ? (
          <div className="flex items-center gap-2">
            <CompanyInlineField
              value={contact.name}
              onSave={(value) => handleFieldSave('name', value)}
              placeholder="Contact name"
              className="text-xl font-semibold"
            />
            {contact.isPrimary && (
              <Badge variant="secondary" className="text-xs shrink-0">
                <Star className="h-3 w-3 mr-1 fill-current text-yellow-500" />
                Primary
              </Badge>
            )}
          </div>
        ) : 'Contact'
      }
      className="max-w-2xl"
      footer={footerContent}
    >
      {isLoading ? (
        <ContactDetailSkeleton />
      ) : contact ? (
        <div className="space-y-6 py-4 px-6">
          {/* Company & Department */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {contact.company.name}
              </span>
            </div>
            {contact.department && (
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {contact.department.name}
                </span>
              </div>
            )}
          </div>

          {/* Contact Fields */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-500">
                Role
              </label>
              <CompanyInlineField
                value={contact.role || ''}
                onSave={(value) => handleFieldSave('role', value)}
                placeholder="e.g., CEO, Manager"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-500">
                Email
              </label>
              <CompanyInlineField
                value={contact.email || ''}
                onSave={(value) => handleFieldSave('email', value)}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-500">
                Phone
              </label>
              <CompanyInlineField
                value={contact.phone || ''}
                onSave={(value) => handleFieldSave('phone', value)}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          <Separator />

          {/* Related Items */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Related Items</h3>

            {/* Deals */}
            {contact.deals.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-500">
                  Deals ({contact.deals.length})
                </h4>
                <div className="space-y-1">
                  {contact.deals.map((deal) => (
                    <div
                      key={deal.id}
                      className="flex items-center justify-between text-sm py-1"
                    >
                      <span className="truncate flex-1 mr-2">{deal.title}</span>
                      <div className="flex items-center gap-2">
                        {deal.value && (
                          <span className="text-gray-500">
                            RM {Number(deal.value).toLocaleString()}
                          </span>
                        )}
                        <Badge variant="outline" className={getStageColor(deal.stage)}>
                          {formatDealStage(deal.stage)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Potentials */}
            {contact.potentials.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-500">
                  Repeat Clients ({contact.potentials.length})
                </h4>
                <div className="space-y-1">
                  {contact.potentials.map((potential) => (
                    <div
                      key={potential.id}
                      className="flex items-center justify-between text-sm py-1"
                    >
                      <span className="truncate flex-1 mr-2">{potential.title}</span>
                      <div className="flex items-center gap-2">
                        {potential.estimatedValue && (
                          <span className="text-gray-500">
                            RM {Number(potential.estimatedValue).toLocaleString()}
                          </span>
                        )}
                        <Badge
                          variant="outline"
                          className={getPotentialStageColor(potential.stage)}
                        >
                          {formatPotentialStage(potential.stage)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            {contact.projects.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-500">
                  Projects ({contact.projects.length})
                </h4>
                <div className="space-y-1">
                  {contact.projects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between text-sm py-1"
                    >
                      <span className="truncate flex-1 mr-2">{project.title}</span>
                      <div className="flex items-center gap-2">
                        {project.revenue && (
                          <span className="text-gray-500">
                            RM {Number(project.revenue).toLocaleString()}
                          </span>
                        )}
                        <Badge
                          variant="outline"
                          className={getProjectStatusColor(project.status)}
                        >
                          {formatProjectStatus(project.status)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {contact.deals.length === 0 &&
              contact.potentials.length === 0 &&
              contact.projects.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No deals, potentials, or projects linked to this contact.
                </p>
              )}
          </div>
        </div>
      ) : (
        <div className="py-8 text-center text-gray-500">
          Contact not found
        </div>
      )}
    </DetailView>
  )
}

function ContactDetailSkeleton() {
  return (
    <div className="space-y-6 py-4 px-6">
      {/* Company / Department */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-5 w-32" />
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>

      <Separator />

      {/* Related items */}
      <Skeleton className="h-5 w-28" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  )
}
