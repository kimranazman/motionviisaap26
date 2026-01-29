import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireEditor } from '@/lib/auth-utils'

// Map document category to analysis type for webhook
const CATEGORY_TO_TYPE: Record<string, string> = {
  INVOICE: 'invoice',
  RECEIPT: 'receipt',
  QUOTATION: 'quotation',
}

// POST /api/projects/[id]/documents/[documentId]/reanalyze - Reset and trigger reanalysis
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { id: projectId, documentId } = await params

    // Find document and verify it belongs to project
    const document = await prisma.document.findFirst({
      where: { id: documentId, projectId },
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Only allow reanalysis for analyzable categories
    const analysisType = CATEGORY_TO_TYPE[document.category]
    if (!analysisType) {
      return NextResponse.json(
        { error: `Cannot analyze documents with category: ${document.category}` },
        { status: 400 }
      )
    }

    // Reset aiStatus to PENDING
    await prisma.document.update({
      where: { id: documentId },
      data: {
        aiStatus: 'PENDING',
        aiAnalyzedAt: null,
      },
    })

    // Trigger AI analysis via webhook
    const webhookHost = process.env.MAC_WEBHOOK_HOST || process.env.MAC_SSH_HOST
    const webhookPort = process.env.MAC_WEBHOOK_PORT || '3333'
    const webhookToken = process.env.MAC_WEBHOOK_TOKEN || 'saap-ai-trigger-2026'

    if (!webhookHost) {
      // No webhook configured - just reset status
      return NextResponse.json({
        message: 'Document reset to pending. Run /ai-analyze manually.',
        documentId,
        status: 'PENDING',
        webhookTriggered: false,
      })
    }

    const webhookUrl = `http://${webhookHost}:${webhookPort}/trigger`

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${webhookToken}`,
        },
        body: JSON.stringify({ type: analysisType }),
      })

      if (!response.ok) {
        console.error('[Reanalyze] Webhook failed:', response.status)
        return NextResponse.json({
          message: 'Document reset to pending but webhook failed. Run /ai-analyze manually.',
          documentId,
          status: 'PENDING',
          webhookTriggered: false,
        })
      }

      const data = await response.json()
      console.log(`[Reanalyze] Triggered ${analysisType} analysis for document ${documentId}`)

      return NextResponse.json({
        message: 'Analysis triggered',
        documentId,
        status: 'PENDING',
        webhookTriggered: true,
        pid: data.pid,
      })
    } catch (webhookError) {
      console.error('[Reanalyze] Webhook error:', webhookError)
      return NextResponse.json({
        message: 'Document reset to pending but webhook unreachable. Run /ai-analyze manually.',
        documentId,
        status: 'PENDING',
        webhookTriggered: false,
      })
    }
  } catch (error) {
    console.error('Error triggering reanalysis:', error)
    return NextResponse.json(
      { error: 'Failed to trigger reanalysis' },
      { status: 500 }
    )
  }
}
