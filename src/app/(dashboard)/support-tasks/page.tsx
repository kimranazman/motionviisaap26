export const dynamic = 'force-dynamic'

import { Header } from '@/components/layout/header'
import { SupportTasksView } from '@/components/support-tasks/support-tasks-view'
import prisma from '@/lib/prisma'

async function getSupportTasks() {
  const tasks = await prisma.supportTask.findMany({
    include: {
      keyResultLinks: {
        include: {
          keyResult: {
            select: { id: true, krId: true, description: true },
          },
        },
      },
    },
    orderBy: [{ category: 'asc' }, { taskId: 'asc' }],
  })
  return tasks
}

export default async function SupportTasksPage() {
  const tasks = await getSupportTasks()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Support Tasks"
        description="30 recurring operational tasks grouped by category"
      />

      <div className="p-3 md:p-6">
        <SupportTasksView tasks={tasks} />
      </div>
    </div>
  )
}
