import { NextRequest, NextResponse } from 'next/server'
import { autoImportIfHighConfidence } from '@/lib/ai-auto-import'

interface AutoImportRequest {
  projectId: string
  documentId: string
}

// POST /api/ai/auto-import - Auto-import HIGH confidence AI results
export async function POST(request: NextRequest) {
  // Note: This endpoint is called by Claude Code after analysis
  // We skip auth here as it's a system-to-system call
  // The actual import functions validate project/document existence

  try {
    const body: AutoImportRequest = await request.json()
    const { projectId, documentId } = body

    if (!projectId || !documentId) {
      return NextResponse.json(
        { error: 'projectId and documentId are required' },
        { status: 400 }
      )
    }

    const result = await autoImportIfHighConfidence(projectId, documentId)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Auto-import API error:', error)
    return NextResponse.json(
      { error: 'Auto-import failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
