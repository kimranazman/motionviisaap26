'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Loader2, CalendarIcon } from 'lucide-react'
import { TaskComments } from './task-comments'
import { TaskTagSelect } from './task-tag-select'
import { TEAM_MEMBER_OPTIONS, cn } from '@/lib/utils'
import {
  getTaskStatusColor,
  getTaskPriorityColor,
  formatTaskStatus,
  formatTaskPriority,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="md:max-w-lg p-0 flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b shrink-0 pr-12">
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
            <DialogTitle className="text-left text-lg leading-snug truncate">
              {task.title}
            </DialogTitle>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0">
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

            {/* Error message */}
            {error && <p className="text-sm text-red-500">{error}</p>}

            <Separator />

            {/* Comments Section */}
            <TaskComments projectId={projectId} taskId={task.id} />
          </div>
        </ScrollArea>

        <DialogFooter className="p-4 border-t shrink-0">
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="w-full"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
