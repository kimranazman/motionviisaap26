import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// Valid analysis types
const VALID_TYPES = ['all', 'costs', 'invoice', 'receipt', 'deliverables'] as const
type AnalysisType = typeof VALID_TYPES[number]

interface TriggerRequest {
  type?: AnalysisType
}

// POST /api/ai/trigger - Trigger AI analysis on Mac via SSH
export async function POST(request: Request) {
  // Admin-only access (TRIG-03)
  const { error } = await requireAdmin()
  if (error) return error

  try {
    // Parse request body
    const body: TriggerRequest = await request.json().catch(() => ({}))
    const type = body.type || 'all'

    // Validate type parameter (TRIG-01)
    if (!VALID_TYPES.includes(type as AnalysisType)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    // Get SSH configuration from environment (TRIG-05)
    const sshHost = process.env.MAC_SSH_HOST
    const sshUser = process.env.MAC_SSH_USER || 'khairul'
    const projectPath = process.env.MAC_PROJECT_PATH

    if (!sshHost || !projectPath) {
      console.error('[AI Trigger] Missing environment variables: MAC_SSH_HOST or MAC_PROJECT_PATH')
      return NextResponse.json(
        { error: 'SSH configuration not set. Check MAC_SSH_HOST and MAC_PROJECT_PATH environment variables.' },
        { status: 500 }
      )
    }

    // Build Claude command based on type
    const claudeArg = type === 'all' ? '' : ` ${type}`
    const claudeCommand = `/ai-analyze${claudeArg}`

    // SSH command to run Claude in detached mode (TRIG-02)
    // Uses nohup and & to run in background so SSH returns immediately
    // Redirects output to a log file for debugging
    const logFile = `/tmp/saap-ai-analyze-${Date.now()}.log`
    const remoteCommand = `cd ${projectPath} && nohup claude "${claudeCommand}" > ${logFile} 2>&1 &`

    const sshCommand = `ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 ${sshUser}@${sshHost} '${remoteCommand}'`

    console.log(`[AI Trigger] Executing: ${sshCommand}`)

    // Execute SSH command (TRIG-04 - errors return 500)
    await execAsync(sshCommand, { timeout: 15000 })

    console.log(`[AI Trigger] Successfully triggered ${type} analysis on Mac`)

    // Return 202 Accepted (async operation started)
    return NextResponse.json(
      {
        message: `AI analysis triggered`,
        type,
        logFile,
      },
      { status: 202 }
    )

  } catch (err) {
    const error = err as Error & { code?: string; stderr?: string }
    console.error('[AI Trigger] SSH error:', error.message)

    // Provide helpful error messages (TRIG-04)
    let errorMessage = 'Failed to trigger AI analysis via SSH'

    if (error.message?.includes('Connection refused')) {
      errorMessage = 'SSH connection refused. Ensure Remote Login is enabled on Mac.'
    } else if (error.message?.includes('Connection timed out') || error.code === 'ETIMEDOUT') {
      errorMessage = 'SSH connection timed out. Check network connectivity to Mac.'
    } else if (error.message?.includes('Permission denied')) {
      errorMessage = 'SSH permission denied. Check SSH key configuration.'
    } else if (error.stderr) {
      errorMessage = `SSH error: ${error.stderr}`
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
