export const dynamic = 'force-dynamic'

import { Header } from '@/components/layout/header'
import { KPICards } from '@/components/dashboard/kpi-cards'
import { StatusChart } from '@/components/dashboard/status-chart'
import { DepartmentChart } from '@/components/dashboard/department-chart'
import { TeamWorkload } from '@/components/dashboard/team-workload'
import { RecentInitiatives } from '@/components/dashboard/recent-initiatives'
import prisma from '@/lib/prisma'

async function getDashboardData() {
  // Get total initiatives
  const totalInitiatives = await prisma.initiative.count()

  // Get initiatives by status
  const statusCounts = await prisma.initiative.groupBy({
    by: ['status'],
    _count: true,
  })

  // Get initiatives by department
  const departmentCounts = await prisma.initiative.groupBy({
    by: ['department'],
    _count: true,
  })

  // Get initiatives by person in charge
  const personCounts = await prisma.initiative.groupBy({
    by: ['personInCharge'],
    _count: true,
    where: {
      personInCharge: { not: null }
    }
  })

  // Calculate stats
  const completedCount = statusCounts.find(s => s.status === 'COMPLETED')?._count || 0
  const atRiskCount = statusCounts.find(s => s.status === 'AT_RISK')?._count || 0
  const revenueTarget = 1000000
  const revenueProgress = totalInitiatives > 0
    ? Math.round((completedCount / totalInitiatives) * revenueTarget)
    : 0
  const completionRate = totalInitiatives > 0
    ? Math.round((completedCount / totalInitiatives) * 100)
    : 0

  // Get upcoming deadlines
  const today = new Date()
  const thirtyDaysLater = new Date(today)
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)

  const upcomingDeadlines = await prisma.initiative.count({
    where: {
      endDate: {
        gte: today,
        lte: thirtyDaysLater,
      },
      status: {
        notIn: ['COMPLETED', 'CANCELLED'],
      },
    },
  })

  // Get recent initiatives
  const recentInitiatives = await prisma.initiative.findMany({
    take: 5,
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      status: true,
      department: true,
      startDate: true,
      endDate: true,
    },
  })

  return {
    stats: {
      totalInitiatives,
      completedCount,
      completionRate,
      revenueProgress,
      revenueTarget,
      upcomingDeadlines,
      atRiskCount,
    },
    byStatus: statusCounts.map(s => ({
      status: s.status,
      count: s._count,
    })),
    byDepartment: departmentCounts.map(d => ({
      department: d.department,
      count: d._count,
    })),
    byPerson: personCounts.map(p => ({
      person: p.personInCharge,
      count: p._count,
    })),
    recentInitiatives: recentInitiatives.map(i => ({
      id: i.id,
      title: i.title,
      status: i.status,
      department: i.department,
      startDate: i.startDate.toISOString(),
      endDate: i.endDate.toISOString(),
    })),
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Dashboard"
        description="Strategic Annual Action Plan 2026"
      />

      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <KPICards stats={data.stats} />

        {/* Charts Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <StatusChart data={data.byStatus} />
          <DepartmentChart data={data.byDepartment} />
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <TeamWorkload data={data.byPerson} total={data.stats.totalInitiatives} />
          <RecentInitiatives initiatives={data.recentInitiatives} />
        </div>
      </div>
    </div>
  )
}
