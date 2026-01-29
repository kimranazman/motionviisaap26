import { format } from 'date-fns'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-utils'
import {
  mapServiceToExportRow,
  buildServicesWorkbook,
} from '@/lib/services-export-utils'

// GET /api/services-pricing/export - Download XLSX file of services pricing
export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  try {
    // Fetch all deliverables with value
    const deliverables = await prisma.deliverable.findMany({
      where: { value: { not: null } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        value: true,
        project: {
          select: {
            id: true,
            title: true,
            company: { select: { id: true, name: true } },
          },
        },
        createdAt: true,
      },
    })

    // Map to flat export rows
    const rows = deliverables.map(mapServiceToExportRow)

    // Build XLSX workbook buffer
    const buf = buildServicesWorkbook(rows)

    // Generate filename with today's date
    const filename = `Services_Pricing_${format(new Date(), 'yyyy-MM-dd')}.xlsx`

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
    console.error('Error exporting services pricing:', err)
    return Response.json(
      { error: 'Failed to export services pricing' },
      { status: 500 }
    )
  }
}
