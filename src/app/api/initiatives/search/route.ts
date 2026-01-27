import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { requireAuth } from '@/lib/auth-utils'

// GET /api/initiatives/search - Search initiatives by text query
export async function GET(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    // Handle empty query - return empty array
    if (!query || query.trim() === '') {
      return NextResponse.json([])
    }

    const searchTerm = query.trim()

    // Build search conditions across multiple fields
    const where: Prisma.InitiativeWhereInput = {
      OR: [
        { title: { contains: searchTerm } },
        { remarks: { contains: searchTerm } },
      ],
    }

    // Also search by person in charge (enum values: KHAIRUL, AZLAN, IZYANI)
    // Match if search term is contained in the formatted name
    const personMatches: string[] = []
    const searchLower = searchTerm.toLowerCase()
    if ('khairul'.includes(searchLower)) personMatches.push('KHAIRUL')
    if ('azlan'.includes(searchLower)) personMatches.push('AZLAN')
    if ('izyani'.includes(searchLower)) personMatches.push('IZYANI')

    if (personMatches.length > 0) {
      where.OR = [
        ...(where.OR as Prisma.InitiativeWhereInput[]),
        { personInCharge: { in: personMatches as never[] } },
      ]
    }

    // Fetch matching initiatives
    const initiatives = await prisma.initiative.findMany({
      where,
      select: {
        id: true,
        title: true,
        status: true,
        personInCharge: true,
      },
      orderBy: [
        // Title matches are more relevant, but Prisma doesn't support relevance ordering
        // So we order by sequence number for consistency
        { sequenceNumber: 'asc' },
      ],
      take: 10, // Limit to 10 results
    })

    return NextResponse.json(initiatives)
  } catch (error) {
    console.error('Error searching initiatives:', error)
    return NextResponse.json(
      { error: 'Failed to search initiatives' },
      { status: 500 }
    )
  }
}
