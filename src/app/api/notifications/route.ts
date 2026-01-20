import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    // Date calculations
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const sevenDaysLater = new Date(today)
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7)

    // Three parallel queries for efficiency
    const [overdue, atRisk, dueSoon] = await Promise.all([
      // Overdue: endDate < today AND status NOT IN ['COMPLETED', 'CANCELLED']
      prisma.initiative.findMany({
        where: {
          endDate: { lt: today },
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
        },
        select: {
          id: true,
          title: true,
          status: true,
          endDate: true,
          personInCharge: true,
        },
        orderBy: { endDate: 'asc' },
        take: 20,
      }),

      // At Risk: status = 'AT_RISK'
      prisma.initiative.findMany({
        where: {
          status: 'AT_RISK',
        },
        select: {
          id: true,
          title: true,
          status: true,
          endDate: true,
          personInCharge: true,
        },
        orderBy: { endDate: 'asc' },
        take: 20,
      }),

      // Due Soon: endDate >= today AND endDate <= sevenDaysLater
      // AND status NOT IN ['COMPLETED', 'CANCELLED', 'AT_RISK']
      // (exclude AT_RISK to avoid duplicates with category b)
      prisma.initiative.findMany({
        where: {
          endDate: { gte: today, lte: sevenDaysLater },
          status: { notIn: ['COMPLETED', 'CANCELLED', 'AT_RISK'] },
        },
        select: {
          id: true,
          title: true,
          status: true,
          endDate: true,
          personInCharge: true,
        },
        orderBy: { endDate: 'asc' },
        take: 20,
      }),
    ])

    // Calculate total count
    const totalCount = overdue.length + atRisk.length + dueSoon.length

    return NextResponse.json({
      overdue,
      atRisk,
      dueSoon,
      totalCount,
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}
