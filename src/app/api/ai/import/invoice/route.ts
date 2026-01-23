import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireEditor } from '@/lib/auth-utils'
import { InvoiceExtraction } from '@/types/ai-extraction'

interface InvoiceImportRequest {
  projectId: string
  extraction: InvoiceExtraction
  addToRevenue: boolean
}

// POST /api/ai/import/invoice - Import AI-extracted invoice data
export async function POST(request: NextRequest) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const body: InvoiceImportRequest = await request.json()
    const { projectId, extraction, addToRevenue } = body

    // Validate required fields
    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      )
    }
    if (!extraction?.documentId) {
      return NextResponse.json(
        { error: 'extraction with documentId is required' },
        { status: 400 }
      )
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, revenue: true },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Verify document exists
    const document = await prisma.document.findUnique({
      where: { id: extraction.documentId },
      select: { id: true, projectId: true, category: true, aiStatus: true },
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Verify document belongs to project
    if (document.projectId !== projectId) {
      return NextResponse.json(
        { error: 'Document does not belong to this project' },
        { status: 400 }
      )
    }

    // Verify document is an invoice
    if (document.category !== 'INVOICE') {
      return NextResponse.json(
        { error: 'Document category must be INVOICE' },
        { status: 400 }
      )
    }

    // Update project revenue if requested
    let updatedProject = project
    if (addToRevenue && extraction.total) {
      const currentRevenue = project.revenue ? Number(project.revenue) : 0
      const newRevenue = currentRevenue + extraction.total

      updatedProject = await prisma.project.update({
        where: { id: projectId },
        data: { revenue: newRevenue },
        select: { id: true, revenue: true },
      })
    }

    // Update document status
    const updatedDocument = await prisma.document.update({
      where: { id: extraction.documentId },
      data: {
        aiStatus: 'IMPORTED',
        aiAnalyzedAt: new Date(),
      },
      select: { id: true, aiStatus: true, aiAnalyzedAt: true },
    })

    return NextResponse.json({
      success: true,
      project: {
        id: updatedProject.id,
        revenue: updatedProject.revenue ? Number(updatedProject.revenue) : null,
      },
      document: {
        id: updatedDocument.id,
        aiStatus: updatedDocument.aiStatus,
        aiAnalyzedAt: updatedDocument.aiAnalyzedAt,
      },
    })
  } catch (error) {
    console.error('Error importing invoice:', error)
    return NextResponse.json(
      { error: 'Failed to import invoice' },
      { status: 500 }
    )
  }
}
