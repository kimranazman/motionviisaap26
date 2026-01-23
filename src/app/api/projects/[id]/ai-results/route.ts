import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-utils'
import { readFile } from 'fs/promises'
import path from 'path'
import { AIAnalysisResult } from '@/types/ai-extraction'

// Match the UPLOADS_DIR from manifest-utils.ts
const UPLOADS_DIR = process.env.UPLOADS_DIR || '/app/uploads'

// GET /api/projects/[id]/ai-results - Read ai-results.json from project folder
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { id: projectId } = await params

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, title: true },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Build path to ai-results.json
    const aiResultsPath = path.join(
      UPLOADS_DIR,
      'projects',
      projectId,
      'ai-results.json'
    )

    try {
      // Try to read the file
      const content = await readFile(aiResultsPath, 'utf-8')
      const results: AIAnalysisResult = JSON.parse(content)

      return NextResponse.json(results)
    } catch (fileError) {
      // File doesn't exist or can't be read
      const err = fileError as NodeJS.ErrnoException
      if (err.code === 'ENOENT') {
        return NextResponse.json(
          {
            error: 'AI results not found',
            message:
              'Run Claude analysis first to generate ai-results.json',
          },
          { status: 404 }
        )
      }

      // JSON parse error
      if (err instanceof SyntaxError) {
        return NextResponse.json(
          {
            error: 'Invalid AI results file',
            message: 'ai-results.json contains invalid JSON',
          },
          { status: 500 }
        )
      }

      // Other file read error
      console.error('Error reading ai-results.json:', fileError)
      return NextResponse.json(
        {
          error: 'Failed to read AI results',
          message: 'Unable to read ai-results.json from project folder',
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error fetching AI results:', error)
    return NextResponse.json(
      { error: 'Failed to fetch AI results' },
      { status: 500 }
    )
  }
}
