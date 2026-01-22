export const dynamic = 'force-dynamic'

import { Header } from '@/components/layout/header'
import { KPICards } from '@/components/dashboard/kpi-cards'
import { StatusChart } from '@/components/dashboard/status-chart'
import { DepartmentChart } from '@/components/dashboard/department-chart'
import { TeamWorkload } from '@/components/dashboard/team-workload'
import { RecentInitiatives } from '@/components/dashboard/recent-initiatives'
import { CRMKPICards } from '@/components/dashboard/crm-kpi-cards'
import { PipelineStageChart } from '@/components/dashboard/pipeline-stage-chart'
import prisma from '@/lib/prisma'
import { STAGES, STAGE_PROBABILITY, STAGE_CHART_COLORS } from '@/lib/pipeline-utils'

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

async function getCRMDashboardData() {
  // Pipeline by stage (open deals only)
  const pipelineByStage = await prisma.deal.groupBy({
    by: ['stage'],
    _count: { _all: true },
    _sum: { value: true },
    where: { stage: { notIn: ['WON', 'LOST'] } }
  })

  // Potential projects by stage (open only = POTENTIAL)
  const potentialsByStage = await prisma.potentialProject.groupBy({
    by: ['stage'],
    _count: { _all: true },
    _sum: { estimatedValue: true },
    where: { stage: 'POTENTIAL' }
  })

  // Total open pipeline (deals)
  const openDealsResult = await prisma.deal.aggregate({
    where: { stage: { notIn: ['WON', 'LOST'] } },
    _sum: { value: true },
    _count: { _all: true }
  })

  // Total open potential projects
  const openPotentialsResult = await prisma.potentialProject.aggregate({
    where: { stage: 'POTENTIAL' },
    _sum: { estimatedValue: true },
    _count: { _all: true }
  })

  // Combined open pipeline
  const openPipelineValue = (Number(openDealsResult._sum.value) || 0) + (Number(openPotentialsResult._sum.estimatedValue) || 0)
  const openPipelineCount = openDealsResult._count._all + openPotentialsResult._count._all

  // Win rate calculation (deals + potential projects)
  const closedDeals = await prisma.deal.count({
    where: { stage: { in: ['WON', 'LOST'] } }
  })
  const wonDeals = await prisma.deal.count({
    where: { stage: 'WON' }
  })
  const closedPotentials = await prisma.potentialProject.count({
    where: { stage: { in: ['CONFIRMED', 'CANCELLED'] } }
  })
  const confirmedPotentials = await prisma.potentialProject.count({
    where: { stage: 'CONFIRMED' }
  })

  // Combined win rate
  const totalClosed = closedDeals + closedPotentials
  const totalWon = wonDeals + confirmedPotentials

  // Revenue from completed projects
  const revenueResult = await prisma.project.aggregate({
    where: { status: 'COMPLETED' },
    _sum: { revenue: true }
  })

  // Total costs from all projects
  const costsResult = await prisma.cost.aggregate({
    _sum: { amount: true }
  })

  const totalRevenue = Number(revenueResult._sum.revenue) || 0
  const totalCosts = Number(costsResult._sum.amount) || 0
  const profit = totalRevenue - totalCosts

  // Calculate weighted forecast (deals + potentials)
  const dealWeightedValue = pipelineByStage.reduce((sum, item) => {
    const value = Number(item._sum.value) || 0
    const probability = STAGE_PROBABILITY[item.stage] || 0
    return sum + (value * probability)
  }, 0)

  const potentialWeightedValue = potentialsByStage.reduce((sum, item) => {
    const value = Number(item._sum.estimatedValue) || 0
    const probability = STAGE_PROBABILITY[item.stage] || 0
    return sum + (value * probability)
  }, 0)

  const weightedValue = dealWeightedValue + potentialWeightedValue

  // Transform to ordered array (deals + potential)
  const dealStageData = STAGES.filter(s => !['WON', 'LOST'].includes(s.id)).map(stage => {
    const found = pipelineByStage.find(m => m.stage === stage.id)
    return {
      id: stage.id,
      name: stage.title,
      count: found?._count._all ?? 0,
      value: Number(found?._sum.value) || 0,
      color: STAGE_CHART_COLORS[stage.id] || '#9CA3AF',
    }
  })

  // Add potential projects as a stage
  const potentialStageData = potentialsByStage.find(p => p.stage === 'POTENTIAL')
  const stageData = [
    ...dealStageData,
    {
      id: 'POTENTIAL',
      name: 'Potential (Repeat)',
      count: potentialStageData?._count._all ?? 0,
      value: Number(potentialStageData?._sum.estimatedValue) || 0,
      color: STAGE_CHART_COLORS['POTENTIAL'] || '#34D399',
    }
  ]

  return {
    stageData,
    openPipeline: openPipelineValue,
    dealCount: openPipelineCount,
    weightedForecast: Math.round(weightedValue),
    winRate: totalClosed > 0 ? Math.round((totalWon / totalClosed) * 100) : 0,
    closedDealsCount: totalClosed,
    totalRevenue,
    totalCosts,
    profit,
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()
  const crmData = await getCRMDashboardData()

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

        {/* Sales & Revenue Section */}
        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales & Revenue</h2>
          <CRMKPICards
            openPipeline={crmData.openPipeline}
            weightedForecast={crmData.weightedForecast}
            winRate={crmData.winRate}
            dealCount={crmData.dealCount}
            totalRevenue={crmData.totalRevenue}
            profit={crmData.profit}
          />
          <div className="mt-6">
            <PipelineStageChart data={crmData.stageData} />
          </div>
        </div>
      </div>
    </div>
  )
}
