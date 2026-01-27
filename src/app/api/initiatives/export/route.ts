import { format } from 'date-fns'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-utils'
import {
  mapInitiativeToExportRow,
  buildInitiativesWorkbook,
} from '@/lib/initiative-export-utils'

// GET /api/initiatives/export - Download XLSX file of all initiatives
export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  try {
    // Own Prisma query with projects + costs (not reusing GET /api/initiatives)
    const initiatives = await prisma.initiative.findMany({
      orderBy: [
        { objective: 'asc' },
        { keyResultId: 'asc' },
        { sequenceNumber: 'asc' },
      ],
      select: {
        id: true,
        sequenceNumber: true,
        title: true,
        objective: true,
        keyResult: { select: { krId: true, description: true } },
        department: true,
        status: true,
        personInCharge: true,
        accountable: true,
        startDate: true,
        endDate: true,
        budget: true,
        resources: true,
        remarks: true,
        // Linked projects with revenue + cost aggregation
        projects: {
          select: {
            id: true,
            revenue: true,
            costs: { select: { amount: true } },
          },
        },
      },
    })

    // Map to flat export rows
    const rows = initiatives.map(mapInitiativeToExportRow)

    // Build XLSX workbook buffer
    const buf = buildInitiativesWorkbook(rows)

    // Generate filename with today's date
    const filename = `SAAP_Initiatives_${format(new Date(), 'yyyy-MM-dd')}.xlsx`

    return new Response(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Length': buf.length.toString(),
      },
    })
  } catch (err) {
    console.error('Error exporting initiatives:', err)
    return Response.json(
      { error: 'Failed to export initiatives' },
      { status: 500 }
    )
  }
}
