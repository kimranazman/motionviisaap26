import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requireEditor } from '@/lib/auth-utils'
import { writeFile, mkdir, unlink } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '@/lib/document-utils'

const UPLOADS_DIR = process.env.UPLOADS_DIR || '/app/uploads'

// GET /api/projects/[id]/documents - List documents for project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { id } = await params

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    const documents = await prisma.document.findMany({
      where: { projectId: id },
      include: {
        uploadedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/documents - Upload document
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireEditor()
  if (error) return error

  try {
    const { id: projectId } = await params
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const category = (formData.get('category') as string) || 'OTHER'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: PDF, PNG, JPG' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum: 10MB' },
        { status: 400 }
      )
    }

    // Verify project exists
    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Create unique storage filename (UUID + original extension)
    const ext = path.extname(file.name)
    const uniqueName = `${randomUUID()}${ext}`
    const relativePath = `projects/${projectId}/${uniqueName}`
    const fullPath = path.join(UPLOADS_DIR, relativePath)

    // Ensure directory exists
    await mkdir(path.dirname(fullPath), { recursive: true })

    // Write file to disk
    const bytes = await file.arrayBuffer()
    await writeFile(fullPath, Buffer.from(bytes))

    try {
      // Create database record
      const document = await prisma.document.create({
        data: {
          projectId,
          filename: file.name, // Original filename for display
          storagePath: relativePath,
          mimeType: file.type,
          size: file.size,
          category: category as 'RECEIPT' | 'INVOICE' | 'OTHER',
          uploadedById: session.user.id,
        },
        include: {
          uploadedBy: { select: { id: true, name: true } },
        },
      })

      return NextResponse.json(document, { status: 201 })
    } catch (dbError) {
      // Cleanup file if DB write failed
      try {
        await unlink(fullPath)
      } catch {
        // Ignore cleanup errors
      }
      throw dbError
    }
  } catch (error) {
    console.error('Error uploading document:', error)
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    )
  }
}
