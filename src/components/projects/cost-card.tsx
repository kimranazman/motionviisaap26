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
import { Edit2, Trash2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getCategoryColor } from '@/lib/cost-utils'

interface Cost {
  id: string
  description: string
  amount: number
  date: string
  categoryId: string
  category: { id: string; name: string }
}

interface CostCardProps {
  cost: Cost
  projectId: string
  onEdit: (cost: Cost) => void
  onDelete: () => void
}

export function CostCard({ cost, projectId, onEdit, onDelete }: CostCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(
        `/api/projects/${projectId}/costs/${cost.id}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        onDelete()
      }
    } catch (error) {
      console.error('Failed to delete cost:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg bg-white hover:bg-gray-50">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{cost.description}</span>
          <Badge variant="outline" className={getCategoryColor(cost.category.name)}>
            {cost.category.name}
          </Badge>
        </div>
        <div className="text-sm text-gray-500 mt-1">
          {formatDate(cost.date)}
        </div>
      </div>

      <div className="flex items-center gap-2 ml-4">
        <span className="font-medium text-gray-900">
          {formatCurrency(cost.amount)}
        </span>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(cost)}
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
              <AlertDialogTitle>Delete Cost</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this cost item? This action
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
