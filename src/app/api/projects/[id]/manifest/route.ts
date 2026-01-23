// API routes for project manifest generation (Phase 25 - AI Document Intelligence)
// GET: Read existing manifest, POST: Generate new manifest

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireEditor } from '@/lib/auth-utils'
import {
  generateProjectManifest,
  getProjectManifest,
} from '@/lib/manifest-utils'

// GET /api/projects/[id]/manifest - Get existing manifest
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { id: projectId } = await params

    const manifest = await getProjectManifest(projectId)

    if (!manifest) {
      return NextResponse.json(
        { error: 'Manifest not found. Generate one first with POST.' },
        { status: 404 }
      )
    }

    return NextResponse.json(manifest)
  } catch (error) {
    console.error('Error reading manifest:', error)
    return NextResponse.json(
      { error: 'Failed to read manifest' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/manifest - Generate new manifest
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { id: projectId } = await params

    const manifest = await generateProjectManifest(projectId)

    return NextResponse.json(manifest, { status: 201 })
  } catch (error) {
    console.error('Error generating manifest:', error)

    // Handle project not found
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json(
      { error: 'Failed to generate manifest' },
      { status: 500 }
    )
  }
}
