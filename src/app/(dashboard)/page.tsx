export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { DashboardClient } from '@/components/dashboard/dashboard-client'
import { getAdminDefaults, DEFAULT_DASHBOARD_LAYOUT } from '@/lib/widgets/defaults'
import prisma from '@/lib/prisma'
import { STAGES, STAGE_PROBABILITY, STAGE_CHART_COLORS } from '@/lib/pipeline-utils'
import { filterWidgetsByRole } from '@/lib/widgets/permissions'
import { WIDGET_IDS } from '@/lib/widgets/registry'
import type { DashboardLayout, LayoutWidgetConfig, DateFilter } from '@/types/dashboard'

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

  // Real revenue from KeyResult model
  const revenueKRs = await prisma.keyResult.findMany({
    where: { metricType: 'REVENUE' },
    select: { krId: true, description: true, target: true, actual: true },
    orderBy: { krId: 'asc' },
  })
  const revenueTarget = revenueKRs.reduce(
    (sum, kr) => sum + Number(kr.target), 0
  )
  const revenueProgress = revenueKRs.reduce(
    (sum, kr) => sum + Number(kr.actual), 0
  )
  const revenueBreakdown = revenueKRs.map(kr => ({
    krId: kr.krId,
    description: kr.description,
    target: Number(kr.target),
    actual: Number(kr.actual),
  }))

  // Calculate stats
  const completedCount = statusCounts.find(s => s.status === 'COMPLETED')?._count || 0
  const atRiskCount = statusCounts.find(s => s.status === 'AT_RISK')?._count || 0
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
    revenueBreakdown,
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

  // Revenue: per-project coalesce (prefer actual revenue, fall back to potentialRevenue)
  // Include both ACTIVE and COMPLETED projects
  const revenueProjects = await prisma.project.findMany({
    where: { status: { in: ['ACTIVE', 'COMPLETED'] } },
    select: { revenue: true, potentialRevenue: true },
  })

  const totalRevenue = revenueProjects.reduce((sum, p) => {
    const projectRevenue = Number(p.revenue) || Number(p.potentialRevenue) || 0
    return sum + projectRevenue
  }, 0)

  // Total costs from all projects
  const costsResult = await prisma.cost.aggregate({
    _sum: { amount: true }
  })

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

async function getUserPreferences(userId: string) {
  const prefs = await prisma.userPreferences.findUnique({
    where: { userId },
  })

  return {
    dashboardLayout: prefs?.dashboardLayout as DashboardLayout | null,
    dateFilter: prefs?.dateFilter as DateFilter | null,
  }
}

export default async function DashboardPage() {
  // Get session for role-based filtering
  const session = await auth()
  if (!session) {
    redirect('/login')
  }

  const userRole = session.user.role

  // Get admin defaults for widget role restrictions
  const adminDefaults = await getAdminDefaults()

  // Filter visible widgets based on user role
  const visibleWidgetIds = filterWidgetsByRole(WIDGET_IDS, userRole, adminDefaults.widgetRoles)

  // Get user preferences
  const userPrefs = await getUserPreferences(session.user.id)

  // Use user layout or default, filtering by role
  let userLayout = userPrefs.dashboardLayout?.widgets || DEFAULT_DASHBOARD_LAYOUT.widgets

  // Filter user's layout to only include widgets they can see
  userLayout = userLayout.filter(w => visibleWidgetIds.includes(w.id))

  // Convert to LayoutWidgetConfig (add instance IDs if missing)
  const initialLayout: LayoutWidgetConfig[] = userLayout.map((w, index) => ({
    ...w,
    i: (w as LayoutWidgetConfig).i || `widget-${index}-${w.id}`,
  }))

  // Load per-breakpoint layouts if available
  const savedBreakpoints = userPrefs.dashboardLayout?.breakpoints
  let initialResponsiveLayouts: Record<string, LayoutWidgetConfig[]> | undefined
  if (savedBreakpoints && typeof savedBreakpoints === 'object') {
    initialResponsiveLayouts = {}
    for (const [bp, bpWidgets] of Object.entries(savedBreakpoints)) {
      if (Array.isArray(bpWidgets)) {
        // Filter by visible widgets and ensure instance IDs exist
        initialResponsiveLayouts[bp] = (bpWidgets as LayoutWidgetConfig[])
          .filter(w => visibleWidgetIds.includes(w.id))
          .map((w, index) => ({
            ...w,
            i: w.i || `widget-${index}-${w.id}`,
          }))
      }
    }
  }

  // Get default layout for reset
  const defaultLayout: LayoutWidgetConfig[] = DEFAULT_DASHBOARD_LAYOUT.widgets
    .filter(w => visibleWidgetIds.includes(w.id))
    .map((w, index) => ({
      ...w,
      i: `default-${index}-${w.id}`,
    }))

  // Always fetch KRI data
  const data = await getDashboardData()

  // Only fetch CRM data if at least one CRM widget is visible
  const shouldFetchCrmData = visibleWidgetIds.includes('crm-kpi-cards') ||
    visibleWidgetIds.includes('pipeline-stage-chart')
  const crmData = shouldFetchCrmData ? await getCRMDashboardData() : null

  return (
    <DashboardClient
      initialLayout={initialLayout}
      initialResponsiveLayouts={initialResponsiveLayouts}
      initialDateFilter={userPrefs.dateFilter}
      defaultLayout={defaultLayout}
      visibleWidgetIds={visibleWidgetIds}
      dashboardData={data}
      crmData={crmData}
    />
  )
}
