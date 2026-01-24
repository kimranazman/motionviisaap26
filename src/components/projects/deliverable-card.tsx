'use client'

import { useState } from 'react'
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
import { Edit2, Trash2, Sparkles } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Deliverable {
  id: string
  title: string
  description: string | null
  value: number | null
  sortOrder: number
  aiExtracted?: boolean
}

interface DeliverableCardProps {
  deliverable: Deliverable
  projectId: string
  onEdit: (deliverable: Deliverable) => void
  onDelete: () => void
}

export function DeliverableCard({ deliverable, projectId, onEdit, onDelete }: DeliverableCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(
        `/api/projects/${projectId}/deliverables/${deliverable.id}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        onDelete()
      }
    } catch (error) {
      console.error('Failed to delete deliverable:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg bg-white hover:bg-gray-50">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{deliverable.title}</span>
          {deliverable.aiExtracted && (
            <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
              <Sparkles className="h-3 w-3 mr-1" />
              AI
            </Badge>
          )}
        </div>
        {deliverable.description && (
          <p className="text-sm text-gray-500 mt-1 truncate">{deliverable.description}</p>
        )}
      </div>

      <div className="flex items-center gap-2 ml-4">
        {deliverable.value !== null && (
          <span className="font-medium text-gray-900">
            {formatCurrency(deliverable.value)}
          </span>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(deliverable)}
        >
          <Edit2 className="h-4 w-4" />
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Deliverable</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this deliverable? This action
                cannot be undone.
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
    </div>
  )
}
