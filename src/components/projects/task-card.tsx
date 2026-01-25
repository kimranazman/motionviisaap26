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
import { Edit2, Trash2, Calendar, MessageSquare, Users } from 'lucide-react'
import { formatTeamMember, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Task {
  id: string
  title: string
  description: string | null
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  dueDate: string | null
  assignee: string | null
  parentId: string | null
  _count?: { children: number; comments: number }
}

interface TaskCardProps {
  task: Task
  projectId: string
  onEdit: (task: Task) => void
  onDelete: () => void
}

const STATUS_CONFIG = {
  TODO: { label: 'To Do', color: 'bg-gray-100 text-gray-700' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  DONE: { label: 'Done', color: 'bg-green-100 text-green-700' },
}

const PRIORITY_CONFIG = {
  LOW: { label: 'Low', color: 'bg-gray-100 text-gray-600' },
  MEDIUM: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
  HIGH: { label: 'High', color: 'bg-red-100 text-red-700' },
}

export function TaskCard({ task, projectId, onEdit, onDelete }: TaskCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(
        `/api/projects/${projectId}/tasks/${task.id}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        onDelete()
      }
    } catch (error) {
      console.error('Failed to delete task:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const statusConfig = STATUS_CONFIG[task.status]
  const priorityConfig = PRIORITY_CONFIG[task.priority]
  const childrenCount = task._count?.children || 0
  const commentsCount = task._count?.comments || 0

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg bg-white hover:bg-gray-50">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn(
            "font-medium truncate",
            task.status === 'DONE' && "line-through text-gray-500"
          )}>
            {task.title}
          </span>
          <Badge variant="secondary" className={statusConfig.color}>
            {statusConfig.label}
          </Badge>
          <Badge variant="outline" className={priorityConfig.color}>
            {priorityConfig.label}
          </Badge>
        </div>

        {/* Meta info row */}
        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
          {task.dueDate && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(task.dueDate)}
            </span>
          )}
          {task.assignee && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {formatTeamMember(task.assignee)}
            </span>
          )}
          {commentsCount > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {commentsCount}
            </span>
          )}
          {childrenCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {childrenCount} subtask{childrenCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 ml-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(task)}
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
              <AlertDialogTitle>Delete Task</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this task?
                {childrenCount > 0 && (
                  <span className="block mt-2 font-medium text-amber-600">
                    This will also delete {childrenCount} subtask{childrenCount !== 1 ? 's' : ''}.
                  </span>
                )}
                This action cannot be undone.
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
