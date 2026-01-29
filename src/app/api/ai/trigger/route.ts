import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'

// Valid analysis types
const VALID_TYPES = ['all', 'costs', 'invoice', 'receipt', 'deliverables'] as const
type AnalysisType = (typeof VALID_TYPES)[number]

interface TriggerRequest {
  type?: AnalysisType
  customInstruction?: string
}

// POST /api/ai/trigger - Trigger AI analysis on Mac via webhook
export async function POST(request: Request) {
  // Admin-only access
  const { error } = await requireAdmin()
  if (error) return error

  try {
    // Parse request body
    const body: TriggerRequest = await request.json().catch(() => ({}))
    const type = body.type || 'all'

    // Validate type parameter
    if (!VALID_TYPES.includes(type as AnalysisType)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    // Get webhook configuration from environment
    const webhookHost = process.env.MAC_WEBHOOK_HOST || process.env.MAC_SSH_HOST
    const webhookPort = process.env.MAC_WEBHOOK_PORT || '3333'
    const webhookToken = process.env.MAC_WEBHOOK_TOKEN || 'saap-ai-trigger-2026'

    if (!webhookHost) {
      console.error('[AI Trigger] Missing MAC_WEBHOOK_HOST environment variable')
      return NextResponse.json(
        { error: 'Webhook configuration not set. Check MAC_WEBHOOK_HOST environment variable.' },
        { status: 500 }
      )
    }

    const webhookUrl = `http://${webhookHost}:${webhookPort}/trigger`

    const customInstruction = body.customInstruction?.trim() || ''
    console.log(
      `[AI Trigger] Calling webhook: ${webhookUrl} with type=${type}${customInstruction ? `, instruction="${customInstruction}"` : ''}`
    )

    // Call the webhook on Mac
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${webhookToken}`,
      },
      body: JSON.stringify({ type, customInstruction }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('[AI Trigger] Webhook error:', response.status, errorData)

      if (response.status === 401) {
        return NextResponse.json({ error: 'Webhook authentication failed' }, { status: 500 })
      }

      return NextResponse.json(
        { error: errorData.error || 'Webhook request failed' },
        { status: 500 }
      )
    }

    const data = await response.json()
    console.log(`[AI Trigger] Successfully triggered ${type} analysis on Mac, pid=${data.pid}`)

    // Return 202 Accepted (async operation started)
    return NextResponse.json(
      {
        message: 'AI analysis triggered',
        type,
        logFile: data.logFile,
        pid: data.pid,
      },
      { status: 202 }
    )
  } catch (err) {
    const error = err as Error & { code?: string; cause?: { code?: string } }
    console.error('[AI Trigger] Error:', error.message)

    // Provide helpful error messages
    let errorMessage = 'Failed to trigger AI analysis'

    if (
      error.cause?.code === 'ECONNREFUSED' ||
      error.message?.includes('ECONNREFUSED')
    ) {
      errorMessage = 'Mac webhook not running. Start it with: node scripts/ai-webhook.js'
    } else if (
      error.cause?.code === 'ETIMEDOUT' ||
      error.message?.includes('ETIMEDOUT')
    ) {
      errorMessage = 'Connection to Mac timed out. Check network connectivity.'
    } else if (error.message) {
      errorMessage = `Error: ${error.message}`
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
