'use client'

import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ChevronRight, Folder } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TaskKanbanCard } from './task-kanban-card'
import type { CrossProjectTask } from './tasks-page-client'

const STATUS_COLUMNS = [
  { id: 'TODO', title: 'To Do', colorDot: 'bg-gray-400' },
  { id: 'IN_PROGRESS', title: 'In Progress', colorDot: 'bg-blue-500' },
  { id: 'DONE', title: 'Done', colorDot: 'bg-green-500' },
]

interface ProjectTasksSectionProps {
  projectId: string | null
  projectTitle: string
  tasks: CrossProjectTask[]
  isExpanded: boolean
  onToggle: () => void
  onTaskClick: (task: CrossProjectTask) => void
}

function StatusColumn({
  columnId,
  title,
  colorDot,
  tasks,
  onTaskClick,
}: {
  columnId: string
  title: string
  colorDot: string
  tasks: CrossProjectTask[]
  onTaskClick: (task: CrossProjectTask) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex-1 min-w-[200px] max-w-[280px] rounded-xl',
        'bg-gray-50/50 backdrop-blur-sm',
        isOver && 'ring-2 ring-blue-400/50'
      )}
    >
      {/* Column Header */}
      <div className="p-3 flex items-center gap-2">
        <div className={cn('w-2 h-2 rounded-full', colorDot)} />
        <span className="text-sm font-medium text-gray-700">{title}</span>
        <span className="ml-auto text-xs text-gray-500 bg-white/60 px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      {/* Cards Container */}
      <div className="p-2 pt-0 space-y-2 min-h-[100px]">
        <SortableContext
          items={tasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map(task => (
            <TaskKanbanCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}

export function ProjectTasksSection({
  projectId,
  projectTitle,
  tasks,
  isExpanded,
  onToggle,
  onTaskClick,
}: ProjectTasksSectionProps) {
  // Group tasks by status
  const tasksByStatus = {
    TODO: tasks.filter(t => t.status === 'TODO'),
    IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS'),
    DONE: tasks.filter(t => t.status === 'DONE'),
  }

  // Count by status for summary
  const statusCounts = {
    todo: tasksByStatus.TODO.length,
    inProgress: tasksByStatus.IN_PROGRESS.length,
    done: tasksByStatus.DONE.length,
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <CollapsibleTrigger className="flex items-center gap-3 w-full p-4 hover:bg-gray-50 transition rounded-t-xl text-left">
          <ChevronRight
            className={cn(
              'h-5 w-5 shrink-0 transition-transform duration-200 text-gray-400',
              isExpanded && 'rotate-90'
            )}
          />
          <Folder className="h-4 w-4 text-gray-400" />
          <span className="font-semibold text-gray-900">{projectTitle}</span>
          <span className="text-sm text-gray-500">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''}
          </span>

          {/* Status summary badges */}
          <div className="flex items-center gap-1.5 ml-auto">
            {statusCounts.inProgress > 0 && (
              <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-xs font-medium">
                {statusCounts.inProgress} In Progress
              </span>
            )}
            {statusCounts.todo > 0 && (
              <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-2 py-0.5 text-xs font-medium">
                {statusCounts.todo} To Do
              </span>
            )}
            {statusCounts.done > 0 && (
              <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-medium">
                {statusCounts.done} Done
              </span>
            )}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-4 pt-0">
            <div className="flex gap-3 overflow-x-auto pb-2">
              {STATUS_COLUMNS.map(column => (
                <StatusColumn
                  key={column.id}
                  columnId={projectId ? `${projectId}:${column.id}` : `no-project:${column.id}`}
                  title={column.title}
                  colorDot={column.colorDot}
                  tasks={tasksByStatus[column.id as keyof typeof tasksByStatus]}
                  onTaskClick={onTaskClick}
                />
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
