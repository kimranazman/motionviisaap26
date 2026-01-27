'use client'

import type { CrossProjectTask } from './tasks-page-client'

interface TaskTableViewProps {
  tasks: CrossProjectTask[]
  onTaskClick: (task: CrossProjectTask) => void
}

export function TaskTableView({ tasks, onTaskClick }: TaskTableViewProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No tasks found</p>
      </div>
    )
  }

  return (
    <div className="text-center py-8">
      <p className="text-gray-500">Table view loading... ({tasks.length} tasks)</p>
    </div>
  )
}
