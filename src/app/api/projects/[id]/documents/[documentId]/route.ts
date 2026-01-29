import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireEditor } from '@/lib/auth-utils'
import { unlink } from 'fs/promises'
import path from 'path'
import { generateProjectManifest } from '@/lib/manifest-utils'

const UPLOADS_DIR = process.env.UPLOADS_DIR || '/app/uploads'

// DELETE /api/projects/[id]/documents/[documentId] - Delete document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { id: projectId, documentId } = await params

    // Find document
    const document = await prisma.document.findFirst({
      where: { id: documentId, projectId },
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Delete file from filesystem
    const fullPath = path.join(UPLOADS_DIR, document.storagePath)
    try {
      await unlink(fullPath)
    } catch (fsError) {
      console.error('Failed to delete file:', fsError)
      // Continue with DB deletion even if file deletion fails
    }

    // Delete database record
    await prisma.document.delete({ where: { id: documentId } })

    // Regenerate manifest async (don't block delete response)
    generateProjectManifest(projectId).catch((err) => {
      console.error('Failed to regenerate manifest after delete:', err)
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    )
  }
}

// PATCH /api/projects/[id]/documents/[documentId] - Update document category
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { id: projectId, documentId } = await params
    const body = await request.json()

    // Validate category
    const validCategories = ['RECEIPT', 'INVOICE', 'QUOTATION', 'OTHER']
    if (body.category && !validCategories.includes(body.category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      )
    }

    // Verify document exists and belongs to project
    const existing = await prisma.document.findFirst({
      where: { id: documentId, projectId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Update document
    const document = await prisma.document.update({
      where: { id: documentId },
      data: {
        category: body.category as 'RECEIPT' | 'INVOICE' | 'QUOTATION' | 'OTHER',
      },
      include: {
        uploadedBy: { select: { id: true, name: true } },
      },
    })

    // Regenerate manifest async (category affects document grouping)
    generateProjectManifest(projectId).catch((err) => {
      console.error('Failed to regenerate manifest after category change:', err)
    })

    return NextResponse.json(document)
  } catch (error) {
    console.error('Error updating document:', error)
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    )
  }
}
