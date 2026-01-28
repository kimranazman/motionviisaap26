export const dynamic = 'force-dynamic'

import { Header } from '@/components/layout/header'
import { MainCalendar } from '@/components/calendar/main-calendar'
import { ViewModeToggle } from '@/components/objectives/view-mode-toggle'
import prisma from '@/lib/prisma'

async function getTasks() {
  const tasks = await prisma.task.findMany({
    where: {
      dueDate: { not: null }
    },
    select: {
      id: true,
      title: true,
      dueDate: true,
      status: true,
      projectId: true,
    },
    orderBy: {
      dueDate: 'asc'
    }
  })

  return tasks.map(t => ({
    ...t,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
  }))
}

async function getProjects() {
  const projects = await prisma.project.findMany({
    where: {
      isArchived: false,
      OR: [
        { startDate: { not: null } },
        { endDate: { not: null } }
      ]
    },
    select: {
      id: true,
      title: true,
      startDate: true,
      endDate: true,
      status: true,
    },
    orderBy: {
      startDate: 'asc'
    }
  })

  return projects.map(p => ({
    ...p,
    startDate: p.startDate ? p.startDate.toISOString() : null,
    endDate: p.endDate ? p.endDate.toISOString() : null,
  }))
}

async function getInitiatives() {
  const initiatives = await prisma.initiative.findMany({
    select: {
      id: true,
      title: true,
      keyResult: { select: { krId: true, description: true } },
      startDate: true,
      endDate: true,
      status: true,
    },
    orderBy: {
      startDate: 'asc'
    }
  })

  return initiatives.map(i => ({
    ...i,
    startDate: i.startDate.toISOString(),
    endDate: i.endDate.toISOString(),
    keyResult: i.keyResult
      ? `${i.keyResult.krId} - ${i.keyResult.description}`
      : 'Unlinked',
  }))
}

export default async function CalendarPage() {
  const [tasks, projects, initiatives] = await Promise.all([
    getTasks(),
    getProjects(),
    getInitiatives(),
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Calendar"
        description="Unified view of tasks, projects, and initiatives"
      />

      <div className="p-6">
        <div className="mb-6">
          <ViewModeToggle />
        </div>
        <MainCalendar
          tasks={tasks}
          projects={projects}
          initiatives={initiatives}
        />
      </div>
    </div>
  )
}
