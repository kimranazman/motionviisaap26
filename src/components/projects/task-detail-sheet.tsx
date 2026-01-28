'use client'

import { useState, useEffect } from 'react'
import { DetailView } from '@/components/ui/detail-view'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader2, CalendarIcon, Plus } from 'lucide-react'
import { TaskComments } from './task-comments'
import { TaskTagSelect } from './task-tag-select'
import { TEAM_MEMBER_OPTIONS, cn } from '@/lib/utils'
import {
  getTaskStatusColor,
  getTaskPriorityColor,
  formatTaskStatus,
  formatTaskPriority,
  canAddSubtask,
} from '@/lib/task-utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { DatePickerCalendar } from '@/components/ui/date-picker-with-presets'
import { format } from 'date-fns'

interface Tag {
  id: string
  name: string
  color: string
}

interface TaskTag {
  tag: Tag
  inherited: boolean
}

interface Task {
  id: string
  title: string
  description: string | null
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  dueDate: string | null
  assignee: string | null
  projectId: string
  parentId: string | null
  depth?: number
  tags?: TaskTag[]
}

interface TaskDetailSheetProps {
  task: Task | null
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskUpdate: () => void
}

const STATUS_OPTIONS = [
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'DONE', label: 'Done' },
]

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
]

export function TaskDetailSheet({
  task,
  projectId,
  open,
  onOpenChange,
  onTaskUpdate,
}: TaskDetailSheetProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'TODO' | 'IN_PROGRESS' | 'DONE'>('TODO')
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM')
  const [dueDate, setDueDate] = useState<Date | null>(null)
  const [assignee, setAssignee] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Tags state - loaded from task
  const [tags, setTags] = useState<TaskTag[]>([])

  // Subtask creation state
  const [showSubtaskForm, setShowSubtaskForm] = useState(false)
  const [subtaskTitle, setSubtaskTitle] = useState('')
  const [isCreatingSubtask, setIsCreatingSubtask] = useState(false)

  // Initialize form when task changes
  useEffect(() => {
    if (task && open) {
      setTitle(task.title)
      setDescription(task.description || '')
      setStatus(task.status)
      setPriority(task.priority)
      setDueDate(task.dueDate ? new Date(task.dueDate) : null)
      setAssignee(task.assignee || '')
      setTags(task.tags || [])
      setError(null)
      setShowSubtaskForm(false)
      setSubtaskTitle('')
    }
  }, [task, open])

  const handleSave = async () => {
    if (!task) return
    setError(null)

    if (!title.trim()) {
      setError('Title is required')
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch(
        `/api/projects/${projectId}/tasks/${task.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || null,
            status,
            priority,
            dueDate: dueDate ? dueDate.toISOString() : null,
            assignee: assignee || null,
          }),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to update task')
        return
      }

      onTaskUpdate()
      onOpenChange(false)
    } catch (err) {
      console.error('Failed to update task:', err)
      setError('Failed to update task')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle tags change - refresh task data
  const handleTagsChange = () => {
    onTaskUpdate()
  }

  // Handle subtask creation
  const handleCreateSubtask = async () => {
    if (!task || !subtaskTitle.trim()) return
    setIsCreatingSubtask(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: subtaskTitle.trim(),
          parentId: task.id,
        }),
      })
      if (response.ok) {
        setSubtaskTitle('')
        setShowSubtaskForm(false)
        onTaskUpdate()
      }
    } catch (err) {
      console.error('Failed to create subtask:', err)
    } finally {
      setIsCreatingSubtask(false)
    }
  }

  if (!task) return null

  // Check for changes
  const formatDateForCompare = (d: Date | null) =>
    d?.toISOString().split('T')[0] || null
  const taskDueDateForCompare = task.dueDate
    ? new Date(task.dueDate).toISOString().split('T')[0]
    : null

  const hasChanges =
    title !== task.title ||
    description !== (task.description || '') ||
    status !== task.status ||
    priority !== task.priority ||
    formatDateForCompare(dueDate) !== taskDueDateForCompare ||
    assignee !== (task.assignee || '')

  const footerContent = (
    <Button
      onClick={handleSave}
      disabled={isSaving || !hasChanges}
      className="w-full"
    >
      {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Save Changes
    </Button>
  )

  return (
    <DetailView
      open={open}
      onOpenChange={onOpenChange}
      title={
        <div className="flex items-center gap-3">
          <Badge
            className={cn('shrink-0', getTaskStatusColor(task.status))}
          >
            {formatTaskStatus(task.status)}
          </Badge>
          <Badge
            variant="outline"
            className={cn('shrink-0', getTaskPriorityColor(task.priority))}
          >
            {formatTaskPriority(task.priority)}
          </Badge>
          <span className="truncate">{task.title}</span>
        </div>
      }
      className="md:max-w-lg"
      footer={footerContent}
    >
          <div className="p-6 space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="task-title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="task-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
              />
            </div>

            {/* Status and Priority - side by side */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as Task['status'])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={priority}
                  onValueChange={(v) => setPriority(v as Task['priority'])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Due Date and Assignee - side by side */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal h-10',
                        !dueDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, 'PP') : 'Pick date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <DatePickerCalendar
                      selected={dueDate || undefined}
                      onSelect={(d) => setDueDate(d || null)}
                      fromYear={2020}
                      toYear={2035}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Assignee</Label>
                <Select value={assignee || '__unassigned__'} onValueChange={(v) => setAssignee(v === '__unassigned__' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__unassigned__">Unassigned</SelectItem>
                    {TEAM_MEMBER_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add task details..."
                className="min-h-[80px]"
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <TaskTagSelect
                taskId={task.id}
                projectId={projectId}
                selectedTags={tags}
                onTagsChange={handleTagsChange}
              />
            </div>

            {/* Subtasks */}
            {canAddSubtask(task.depth ?? 0) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Subtasks</Label>
                  {!showSubtaskForm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSubtaskForm(true)}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Add Subtask
                    </Button>
                  )}
                </div>
                {showSubtaskForm && (
                  <div className="flex gap-2">
                    <Input
                      value={subtaskTitle}
                      onChange={(e) => setSubtaskTitle(e.target.value)}
                      placeholder="Subtask title..."
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && subtaskTitle.trim()) {
                          handleCreateSubtask()
                        }
                        if (e.key === 'Escape') {
                          setShowSubtaskForm(false)
                          setSubtaskTitle('')
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={handleCreateSubtask}
                      disabled={!subtaskTitle.trim() || isCreatingSubtask}
                    >
                      {isCreatingSubtask ? 'Adding...' : 'Add'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowSubtaskForm(false)
                        setSubtaskTitle('')
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Error message */}
            {error && <p className="text-sm text-red-500">{error}</p>}

            <Separator />

            {/* Comments Section */}
            <TaskComments projectId={projectId} taskId={task.id} />
          </div>
    </DetailView>
  )
}
