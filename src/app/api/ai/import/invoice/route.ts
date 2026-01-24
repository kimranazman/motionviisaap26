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
      select: { id: true, revenue: true, potentialRevenue: true },
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

    // Replace project revenue with AI-extracted amount (invoice is source of truth)
    // potentialRevenue may have been set from deal/potential conversion (estimate)
    // revenue is now set by AI invoice import only (actuals)
    let updatedProject = project
    if (addToRevenue && extraction.total) {
      updatedProject = await prisma.project.update({
        where: { id: projectId },
        data: {
          revenue: extraction.total, // Only set actual revenue
        },
        select: { id: true, revenue: true, potentialRevenue: true },
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
        potentialRevenue: updatedProject.potentialRevenue ? Number(updatedProject.potentialRevenue) : null,
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
