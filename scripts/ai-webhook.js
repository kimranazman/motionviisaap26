#!/usr/bin/env node
/**
 * AI Analyze Webhook Server
 *
 * Runs on Mac and listens for POST requests from NAS to trigger Claude /ai-analyze.
 * Executes Claude in the user's authenticated context.
 *
 * Usage:
 *   node scripts/ai-webhook.js
 *
 * Or run in background:
 *   nohup node scripts/ai-webhook.js > /tmp/ai-webhook.log 2>&1 &
 */

const http = require('http')
const { spawn } = require('child_process')
const path = require('path')

const PORT = 3333
const PROJECT_PATH = '/Users/khairul/Documents/MyDev/Work/Motionvii/saap2026v2'
const CLAUDE_PATH = '/Users/khairul/.local/bin/claude'

// Simple auth token (change this!)
const AUTH_TOKEN = 'saap-ai-trigger-2026'

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }

  if (req.method !== 'POST' || req.url !== '/trigger') {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Not found' }))
    return
  }

  // Check auth
  const authHeader = req.headers['authorization']
  if (authHeader !== `Bearer ${AUTH_TOKEN}`) {
    res.writeHead(401, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Unauthorized' }))
    return
  }

  let body = ''
  req.on('data', chunk => { body += chunk })
  req.on('end', () => {
    let type = 'all'
    try {
      const data = JSON.parse(body)
      if (data.type && ['all', 'costs', 'invoice', 'receipt', 'deliverables'].includes(data.type)) {
        type = data.type
      }
    } catch (e) {
      // Use default
    }

    const claudeArg = type === 'all' ? '/ai-analyze' : `/ai-analyze ${type}`
    const logFile = `/tmp/saap-ai-analyze-${Date.now()}.log`

    console.log(`[${new Date().toISOString()}] Triggering: claude "${claudeArg}"`)

    // Spawn Claude process
    const claude = spawn(CLAUDE_PATH, [claudeArg], {
      cwd: PROJECT_PATH,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, HOME: '/Users/khairul' }
    })

    // Log output to file
    const fs = require('fs')
    const logStream = fs.createWriteStream(logFile)
    claude.stdout.pipe(logStream)
    claude.stderr.pipe(logStream)

    claude.on('error', (err) => {
      console.error(`[${new Date().toISOString()}] Error:`, err.message)
    })

    claude.on('close', (code) => {
      console.log(`[${new Date().toISOString()}] Claude exited with code ${code}`)
      logStream.end()
    })

    // Don't wait for Claude to finish
    claude.unref()

    res.writeHead(202, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      message: 'AI analysis triggered',
      type,
      logFile,
      pid: claude.pid
    }))
  })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[${new Date().toISOString()}] AI Webhook server running on port ${PORT}`)
  console.log(`  POST http://localhost:${PORT}/trigger`)
  console.log(`  Authorization: Bearer ${AUTH_TOKEN}`)
})
