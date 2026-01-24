'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { Building, Trash2, Users, Briefcase, FileStack } from 'lucide-react'
import { CompanyInlineField } from './company-inline-field'

interface Department {
  id: string
  name: string
  description: string | null
  _count: {
    contacts: number
    deals: number
    potentials: number
  }
}

interface DepartmentCardProps {
  department: Department
  companyId: string
  onUpdate: () => void
  onDelete: () => void
}

export function DepartmentCard({
  department,
  companyId,
  onUpdate,
  onDelete,
}: DepartmentCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleFieldSave = async (field: string, value: string) => {
    const response = await fetch(
      `/api/companies/${companyId}/departments/${department.id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      }
    )

    if (!response.ok) {
      throw new Error('Failed to update')
    }

    onUpdate()
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    setDeleteError(null)

    try {
      const response = await fetch(
        `/api/companies/${companyId}/departments/${department.id}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        onDelete()
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

  const totalLinked =
    department._count.contacts +
    department._count.deals +
    department._count.potentials

  return (
    <Card className="p-3">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-50">
          <Building className="h-5 w-5 text-purple-600" />
        </div>

        <div className="flex-1 min-w-0">
          <CompanyInlineField
            value={department.name}
            onSave={(value) => handleFieldSave('name', value)}
            placeholder="Department name"
            className="font-medium"
          />

          {department.description && (
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
              {department.description}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {department._count.contacts} contacts
            </span>
            <span className="flex items-center gap-1">
              <Briefcase className="h-3 w-3" />
              {department._count.deals} deals
            </span>
            <span className="flex items-center gap-1">
              <FileStack className="h-3 w-3" />
              {department._count.potentials} potentials
            </span>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-gray-400 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Department</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{department.name}&quot;?
                {totalLinked > 0 && (
                  <span className="block mt-2 text-amber-600">
                    {totalLinked} linked item{totalLinked !== 1 ? 's' : ''} will be
                    unassigned from this department.
                  </span>
                )}
                {deleteError && (
                  <span className="block mt-2 text-red-600">{deleteError}</span>
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
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  )
}
