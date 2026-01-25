'use client'

import { useState, useMemo, useEffect } from 'react'
import { TaskTreeNode } from './task-tree-node'
import { TaskForm } from './task-form'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Plus, ListTodo } from 'lucide-react'
import {
  buildTaskTree,
  getTotalProgress,
  type Task,
} from '@/lib/task-utils'

interface TaskTreeProps {
  projectId: string
  tasks: Task[]
  onTasksChange: () => void
}

export function TaskTree({ projectId, tasks, onTasksChange }: TaskTreeProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  // Build tree structure from flat list
  const tree = useMemo(() => buildTaskTree(tasks), [tasks])

  // Initialize expanded state with all task IDs when tasks change
  useEffect(() => {
    if (tasks.length > 0) {
      setExpandedIds(new Set(tasks.map((t) => t.id)))
    }
  }, [tasks])

  const toggleExpanded = (taskId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(taskId)) {
        next.delete(taskId)
      } else {
        next.add(taskId)
      }
      return next
    })
  }

  // Calculate overall progress
  const { completed, total } = getTotalProgress(tasks)

  const handleTaskSuccess = () => {
    onTasksChange()
    setShowAddForm(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="text-muted-foreground">Tasks</Label>
          {total > 0 && (
            <Badge variant="secondary" className="text-xs">
              {completed}/{total}
            </Badge>
          )}
        </div>
        {total > 0 && !showAddForm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Task
          </Button>
        )}
      </div>

      {/* Add task form (root level) */}
      {showAddForm && (
        <TaskForm
          projectId={projectId}
          onSuccess={handleTaskSuccess}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Empty state */}
      {tree.length === 0 && !showAddForm ? (
        <Card className="p-6 text-center border-dashed">
          <ListTodo className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500 mb-3">No tasks yet</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add your first task
          </Button>
        </Card>
      ) : (
        <div className="space-y-1">
          {tree.map((task) => (
            <TaskTreeNode
              key={task.id}
              task={task}
              projectId={projectId}
              level={0}
              expandedIds={expandedIds}
              onToggleExpanded={toggleExpanded}
              onTaskUpdate={onTasksChange}
            />
          ))}
        </div>
      )}
    </div>
  )
}
