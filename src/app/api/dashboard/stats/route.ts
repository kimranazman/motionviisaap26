import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-utils'

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  try {
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

    // Get initiatives by objective
    const objectiveCounts = await prisma.initiative.groupBy({
      by: ['objective'],
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
      select: { target: true, actual: true },
    })
    const revenueTarget = revenueKRs.reduce(
      (sum, kr) => sum + Number(kr.target), 0
    )
    const revenueProgress = revenueKRs.reduce(
      (sum, kr) => sum + Number(kr.actual), 0
    )

    const completedCount = statusCounts.find(s => s.status === 'COMPLETED')?._count || 0

    // Calculate completion rate
    const completionRate = totalInitiatives > 0
      ? Math.round((completedCount / totalInitiatives) * 100)
      : 0

    // Get upcoming deadlines (initiatives ending in next 30 days)
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

    // Get at-risk count
    const atRiskCount = statusCounts.find(s => s.status === 'AT_RISK')?._count || 0

    // Format response
    const stats = {
      totalInitiatives,
      completedCount,
      completionRate,
      revenueProgress,
      revenueTarget,
      upcomingDeadlines,
      atRiskCount,
      byStatus: statusCounts.map(s => ({
        status: s.status,
        count: s._count,
      })),
      byDepartment: departmentCounts.map(d => ({
        department: d.department,
        count: d._count,
      })),
      byObjective: objectiveCounts.map(o => ({
        objective: o.objective,
        count: o._count,
      })),
      byPerson: personCounts.map(p => ({
        person: p.personInCharge,
        count: p._count,
      })),
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}
