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
import { Trash2, Building2, Star, Mail, Phone, Briefcase } from 'lucide-react'
import { CompanyInlineField } from '@/components/companies/company-inline-field'
import { formatDealStage, getStageColor } from '@/lib/pipeline-utils'
import { formatPotentialStage, getPotentialStageColor } from '@/lib/potential-utils'

interface Contact {
  id: string
  name: string
  email: string | null
  phone: string | null
  role: string | null
  isPrimary: boolean
}

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

interface Department {
  id: string
  name: string
  description: string | null
  company: { id: string; name: string }
  contacts: Contact[]
  deals: RelatedDeal[]
  potentials: RelatedPotential[]
  _count: {
    contacts: number
    deals: number
    potentials: number
  }
}

interface DepartmentDetailModalProps {
  departmentId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
  onUpdated: () => void
}

export function DepartmentDetailModal({
  departmentId,
  open,
  onOpenChange,
  onDeleted,
  onUpdated,
}: DepartmentDetailModalProps) {
  const [department, setDepartment] = useState<Department | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const fetchDepartment = useCallback(async () => {
    if (!departmentId) return

    setIsLoading(true)
    setDepartment(null)

    try {
      const response = await fetch(`/api/departments/${departmentId}`)
      if (response.ok) {
        const data = await response.json()
        setDepartment(data)
      }
    } catch (error) {
      console.error('Failed to fetch department:', error)
    } finally {
      setIsLoading(false)
    }
  }, [departmentId])

  useEffect(() => {
    if (departmentId && open) {
      fetchDepartment()
    }
  }, [departmentId, open, fetchDepartment])

  const handleFieldSave = async (field: string, value: string) => {
    if (!department) return

    const response = await fetch(`/api/departments/${department.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    })

    if (response.ok) {
      await fetchDepartment()
      onUpdated()
    } else {
      throw new Error('Failed to update')
    }
  }

  const handleDelete = async () => {
    if (!department) return

    setIsDeleting(true)
    setDeleteError(null)

    try {
      const response = await fetch(`/api/departments/${department.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onDeleted()
      } else {
        const data = await response.json()
        setDeleteError(data.error || 'Failed to delete department')
      }
    } catch {
      setDeleteError('Failed to delete department')
    } finally {
      setIsDeleting(false)
    }
  }

  const footerContent = department ? (
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
            <AlertDialogTitle>Delete Department</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{department.name}&quot;?
              {(department._count.contacts > 0 || department._count.deals > 0) && (
                <span className="block mt-2 text-amber-600">
                  {department._count.contacts + department._count.deals + department._count.potentials} linked
                  item{department._count.contacts + department._count.deals + department._count.potentials !== 1 ? 's' : ''} will
                  be unassigned.
                </span>
              )}
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
              {isDeleting ? 'Deleting...' : 'Delete Department'}
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
        department ? (
          <CompanyInlineField
            value={department.name}
            onSave={(value) => handleFieldSave('name', value)}
            placeholder="Department name"
            className="text-xl font-semibold"
          />
        ) : 'Department'
      }
      className="max-w-2xl"
      footer={footerContent}
    >
      {isLoading ? (
        <DepartmentDetailSkeleton />
      ) : department ? (
        <div className="space-y-6 py-4 px-6">
          {/* Company */}
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {department.company.name}
            </span>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-500">
              Description
            </label>
            <CompanyInlineField
              value={department.description || ''}
              onSave={(value) => handleFieldSave('description', value)}
              placeholder="Add a description..."
              multiline
            />
          </div>

          <Separator />

          {/* Contacts Section */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">
              Contacts
              {department._count.contacts > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({department._count.contacts})
                </span>
              )}
            </h3>

            {department.contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No contacts in this department.
              </p>
            ) : (
              <div className="space-y-2">
                {department.contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-start gap-3 p-3 rounded-lg border"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{contact.name}</span>
                        {contact.isPrimary && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="h-3 w-3 mr-1 fill-current text-yellow-500" />
                            Primary
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 mt-1 text-xs text-gray-500">
                        {contact.role && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {contact.role}
                          </span>
                        )}
                        {contact.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {contact.email}
                          </span>
                        )}
                        {contact.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {contact.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {department._count.contacts > 20 && (
                  <p className="text-xs text-muted-foreground">
                    +{department._count.contacts - 20} more contacts
                  </p>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Related Items */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Related Items</h3>

            {/* Deals */}
            {department.deals.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-500">
                  Deals ({department._count.deals})
                </h4>
                <div className="space-y-1">
                  {department.deals.map((deal) => (
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
                  {department._count.deals > 10 && (
                    <p className="text-xs text-muted-foreground">
                      +{department._count.deals - 10} more deals
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Potentials */}
            {department.potentials.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-500">
                  Repeat Clients ({department._count.potentials})
                </h4>
                <div className="space-y-1">
                  {department.potentials.map((potential) => (
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
                  {department._count.potentials > 10 && (
                    <p className="text-xs text-muted-foreground">
                      +{department._count.potentials - 10} more potentials
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Empty state */}
            {department.deals.length === 0 &&
              department.potentials.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No deals or potential projects linked to this department.
                </p>
              )}
          </div>
        </div>
      ) : (
        <div className="py-8 text-center text-gray-500">
          Department not found
        </div>
      )}
    </DetailView>
  )
}

function DepartmentDetailSkeleton() {
  return (
    <div className="space-y-6 py-4 px-6">
      <Skeleton className="h-5 w-40" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-16 w-full" />
      </div>
      <Separator />
      <Skeleton className="h-5 w-24" />
      <div className="space-y-2">
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
    </div>
  )
}
