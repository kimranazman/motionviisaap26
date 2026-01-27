export const dynamic = 'force-dynamic'

import { Header } from '@/components/layout/header'
import { TasksPageClient } from '@/components/tasks/tasks-page-client'
import prisma from '@/lib/prisma'

async function getAllTasks() {
  const tasks = await prisma.task.findMany({
    where: { parentId: null },
    include: {
      project: {
        select: { id: true, title: true },
      },
      _count: {
        select: { children: true, comments: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate?.toISOString() || null,
    assignee: t.assignee,
    projectId: t.projectId,
    project: t.project,
    _count: t._count,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }))
}

async function getProjects() {
  const projects = await prisma.project.findMany({
    where: { tasks: { some: {} } },
    select: { id: true, title: true },
    orderBy: { title: 'asc' },
  })
  return projects
}

export default async function TasksPage() {
  const [tasks, projects] = await Promise.all([getAllTasks(), getProjects()])

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Tasks" description="All tasks across projects" />
      <div className="p-6">
        <TasksPageClient initialTasks={tasks} projects={projects} />
      </div>
    </div>
  )
}
