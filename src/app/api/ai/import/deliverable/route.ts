import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireEditor } from '@/lib/auth-utils'
import { DeliverableExtraction } from '@/types/ai-extraction'

interface DeliverableImportRequest {
  projectId: string
  extraction: DeliverableExtraction
  documentId?: string  // Optional - if provided, update document aiStatus
}

// POST /api/ai/import/deliverable - Import AI-extracted deliverables
export async function POST(request: NextRequest) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const body: DeliverableImportRequest = await request.json()
    const { projectId, extraction, documentId } = body

    // Validate required fields
    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      )
    }
    if (!extraction?.deliverables || extraction.deliverables.length === 0) {
      return NextResponse.json(
        { error: 'extraction with deliverables array is required' },
        { status: 400 }
      )
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Get current max sortOrder
    const maxSortOrder = await prisma.deliverable.aggregate({
      where: { projectId },
      _max: { sortOrder: true },
    })
    let nextSortOrder = (maxSortOrder._max.sortOrder ?? -1) + 1

    // Create deliverables in transaction
    const created = await prisma.$transaction(
      extraction.deliverables.map((d) =>
        prisma.deliverable.create({
          data: {
            projectId,
            title: d.title,
            description: d.description || null,
            value: d.value,
            sortOrder: nextSortOrder++,
            aiExtracted: true,
          },
        })
      )
    )

    // Update document status if documentId provided
    if (documentId) {
      await prisma.document.update({
        where: { id: documentId },
        data: {
          aiStatus: 'IMPORTED',
          aiAnalyzedAt: new Date(),
        },
      })
    }

    return NextResponse.json({
      success: true,
      createdCount: created.length,
      deliverables: created.map((d) => ({
        ...d,
        value: d.value ? Number(d.value) : null,
      })),
    })
  } catch (error) {
    console.error('Error importing deliverables:', error)
    return NextResponse.json(
      { error: 'Failed to import deliverables' },
      { status: 500 }
    )
  }
}
