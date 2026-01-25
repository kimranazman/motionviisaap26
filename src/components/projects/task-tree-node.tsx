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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  ChevronRight,
  ChevronDown,
  Edit2,
  Trash2,
  Plus,
  Calendar,
  MessageSquare,
  Users,
  Lock,
} from 'lucide-react'
import { formatTeamMember, formatDate, cn } from '@/lib/utils'
import {
  calculateProgress,
  canAddSubtask,
  getTaskStatusColor,
  getTaskPriorityColor,
  formatTaskStatus,
  formatTaskPriority,
  type TaskWithChildren,
} from '@/lib/task-utils'
import { TaskForm } from './task-form'

interface TaskTreeNodeProps {
  task: TaskWithChildren
  projectId: string
  level: number
  expandedIds: Set<string>
  onToggleExpanded: (taskId: string) => void
  onTaskUpdate: () => void
}

export function TaskTreeNode({
  task,
  projectId,
  level,
  expandedIds,
  onToggleExpanded,
  onTaskUpdate,
}: TaskTreeNodeProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showAddSubtaskForm, setShowAddSubtaskForm] = useState(false)

  const hasChildren = task.children.length > 0
  const isExpanded = expandedIds.has(task.id)
  const canAdd = canAddSubtask(task.depth)
  const childrenCount = task._count?.children ?? task.children.length
  const commentsCount = task._count?.comments ?? 0

  // Calculate subtask progress
  const { completed, total } = calculateProgress(task)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(
        `/api/projects/${projectId}/tasks/${task.id}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        onTaskUpdate()
      }
    } catch (error) {
      console.error('Failed to delete task:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEditSuccess = () => {
    setShowEditForm(false)
    onTaskUpdate()
  }

  const handleAddSubtaskSuccess = () => {
    setShowAddSubtaskForm(false)
    onTaskUpdate()
  }

  // Indentation based on level
  const indentStyle = { marginLeft: `${level * 24}px` }

  // If editing, show the edit form
  if (showEditForm) {
    return (
      <div style={indentStyle}>
        <TaskForm
          projectId={projectId}
          task={{
            id: task.id,
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate,
            assignee: task.assignee,
            parentId: task.parentId,
          }}
          onSuccess={handleEditSuccess}
          onCancel={() => setShowEditForm(false)}
        />
      </div>
    )
  }

  return (
    <div style={indentStyle}>
      <Collapsible open={isExpanded} onOpenChange={() => onToggleExpanded(task.id)}>
        <div className="flex items-center gap-1 p-2 border rounded-lg bg-white hover:bg-gray-50 group">
          {/* Expand/collapse button or spacer */}
          {hasChildren ? (
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          ) : (
            <div className="w-6 shrink-0" />
          )}

          {/* Task content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Title */}
              <span
                className={cn(
                  'font-medium truncate',
                  task.status === 'DONE' && 'line-through text-gray-500'
                )}
              >
                {task.title}
              </span>

              {/* Status badge */}
              <Badge
                variant="secondary"
                className={cn('text-xs', getTaskStatusColor(task.status))}
              >
                {formatTaskStatus(task.status)}
              </Badge>

              {/* Priority badge */}
              <Badge
                variant="outline"
                className={cn('text-xs', getTaskPriorityColor(task.priority))}
              >
                {formatTaskPriority(task.priority)}
              </Badge>

              {/* Progress indicator if has children */}
              {total > 0 && (
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                  {completed}/{total}
                </Badge>
              )}
            </div>

            {/* Meta info row */}
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 flex-wrap">
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
              {/* Tags display */}
              {task.tags && task.tags.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  {task.tags.map(({ tag, inherited }) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className={cn('text-xs py-0 px-1.5', inherited && 'opacity-75')}
                      style={{
                        backgroundColor: `${tag.color}20`,
                        borderColor: tag.color,
                        color: tag.color,
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full mr-1"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                      {inherited && <Lock className="h-2.5 w-2.5 ml-0.5" />}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            {canAdd && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title="Add subtask"
                onClick={() => setShowAddSubtaskForm(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title="Edit task"
              onClick={() => setShowEditForm(true)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                  title="Delete task"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Task</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete &quot;{task.title}&quot;?
                    {childrenCount > 0 && (
                      <span className="block mt-2 font-medium text-amber-600">
                        This will also delete {childrenCount} subtask
                        {childrenCount !== 1 ? 's' : ''}.
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

        {/* Add subtask form - shown below the task */}
        {showAddSubtaskForm && (
          <div className="mt-1" style={{ marginLeft: '24px' }}>
            <TaskForm
              projectId={projectId}
              parentId={task.id}
              onSuccess={handleAddSubtaskSuccess}
              onCancel={() => setShowAddSubtaskForm(false)}
            />
          </div>
        )}

        {/* Children - rendered recursively */}
        <CollapsibleContent>
          <div className="mt-1 space-y-1">
            {task.children.map((child) => (
              <TaskTreeNode
                key={child.id}
                task={child}
                projectId={projectId}
                level={level + 1}
                expandedIds={expandedIds}
                onToggleExpanded={onToggleExpanded}
                onTaskUpdate={onTaskUpdate}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
