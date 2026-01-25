/**
 * Task tree utilities for building hierarchical task structures,
 * calculating progress, and handling descendant operations.
 */

import { TaskStatus } from '@prisma/client'

// Base task interface matching API response
export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  dueDate: string | null
  assignee: string | null
  projectId: string
  parentId: string | null
  depth: number
  sortOrder: number
  createdAt: string
  updatedAt: string
  tags?: { tag: { id: string; name: string; color: string }; inherited: boolean }[]
  _count?: { children: number; comments: number }
}

// Task with children for tree structure
export interface TaskWithChildren extends Task {
  children: TaskWithChildren[]
}

/**
 * Build tree structure from flat list of tasks.
 *
 * @param tasks - Flat array of tasks with parentId references
 * @returns Array of root tasks (parentId === null) with nested children
 *
 * Algorithm:
 * 1. First pass: create map of id -> node with empty children
 * 2. Second pass: connect parent-child relationships
 * 3. Sort children by sortOrder at each level
 * 4. Return root nodes
 */
export function buildTaskTree(tasks: Task[]): TaskWithChildren[] {
  const taskMap = new Map<string, TaskWithChildren>()
  const roots: TaskWithChildren[] = []

  // First pass: create nodes with empty children
  tasks.forEach(task => {
    taskMap.set(task.id, { ...task, children: [] })
  })

  // Second pass: connect parent-child relationships
  tasks.forEach(task => {
    const node = taskMap.get(task.id)!
    if (task.parentId) {
      const parent = taskMap.get(task.parentId)
      if (parent) {
        parent.children.push(node)
      }
    } else {
      roots.push(node)
    }
  })

  // Sort children by sortOrder recursively
  const sortChildren = (nodes: TaskWithChildren[]) => {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder)
    nodes.forEach(node => sortChildren(node.children))
  }
  sortChildren(roots)

  return roots
}

/**
 * Calculate subtask progress for a task.
 * Counts all descendant tasks recursively.
 *
 * @param task - Task with children to calculate progress for
 * @returns Object with completed count and total count
 */
export function calculateProgress(task: TaskWithChildren): { completed: number; total: number } {
  let completed = 0
  let total = 0

  const countTasks = (t: TaskWithChildren) => {
    t.children.forEach(child => {
      total++
      if (child.status === 'DONE') {
        completed++
      }
      countTasks(child) // Recurse into nested subtasks
    })
  }

  countTasks(task)
  return { completed, total }
}

/**
 * Get all descendant task IDs for cascade operations.
 * Works with a flat list of tasks (not tree structure).
 *
 * @param tasks - Flat array of tasks
 * @param taskId - ID of the parent task
 * @returns Array of descendant task IDs (not including the root task)
 */
export function getDescendantIds(tasks: Task[], taskId: string): string[] {
  const descendants: string[] = []
  const taskMap = new Map(tasks.map(t => [t.id, t]))

  const collectDescendants = (parentId: string) => {
    tasks.forEach(task => {
      if (task.parentId === parentId) {
        descendants.push(task.id)
        collectDescendants(task.id)
      }
    })
  }

  // Verify the root task exists
  if (taskMap.has(taskId)) {
    collectDescendants(taskId)
  }

  return descendants
}

/**
 * Get total task counts for a flat list of tasks.
 *
 * @param tasks - Flat array of tasks
 * @returns Object with total and completed counts
 */
export function getTotalProgress(tasks: Task[]): { completed: number; total: number } {
  const total = tasks.length
  const completed = tasks.filter(t => t.status === 'DONE').length
  return { completed, total }
}

/**
 * Check if a task can have subtasks added (max 5 levels).
 *
 * @param depth - Current task depth (0-indexed)
 * @returns True if subtasks can be added
 */
export function canAddSubtask(depth: number): boolean {
  return depth < 4 // 0-indexed, so depth 4 = level 5 (max)
}

/**
 * Format task status for display.
 */
export function formatTaskStatus(status: TaskStatus): string {
  const statusMap: Record<TaskStatus, string> = {
    TODO: 'To Do',
    IN_PROGRESS: 'In Progress',
    DONE: 'Done',
  }
  return statusMap[status] || status
}

/**
 * Get status color classes for task badges.
 */
export function getTaskStatusColor(status: TaskStatus): string {
  const colors: Record<TaskStatus, string> = {
    TODO: 'bg-gray-100 text-gray-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    DONE: 'bg-green-100 text-green-700',
  }
  return colors[status] || 'bg-gray-100 text-gray-700'
}

/**
 * Format task priority for display.
 */
export function formatTaskPriority(priority: 'LOW' | 'MEDIUM' | 'HIGH'): string {
  const priorityMap: Record<string, string> = {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
  }
  return priorityMap[priority] || priority
}

/**
 * Get priority color classes for task badges.
 */
export function getTaskPriorityColor(priority: 'LOW' | 'MEDIUM' | 'HIGH'): string {
  const colors: Record<string, string> = {
    LOW: 'bg-gray-100 text-gray-600',
    MEDIUM: 'bg-yellow-100 text-yellow-700',
    HIGH: 'bg-red-100 text-red-700',
  }
  return colors[priority] || 'bg-gray-100 text-gray-600'
}

// Task status options for forms/filters
export const TASK_STATUS_OPTIONS = [
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'DONE', label: 'Done' },
] as const

// Task priority options for forms/filters
export const TASK_PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
] as const
