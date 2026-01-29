import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-utils'
import path from 'path'
import { existsSync } from 'fs'

// Match the UPLOADS_DIR from manifest-utils.ts
const UPLOADS_DIR = process.env.UPLOADS_DIR || '/app/uploads'

interface ProjectPendingSummary {
  id: string
  title: string
  company: string
  pendingInvoices: number
  pendingReceipts: number
  hasManifest: boolean
}

interface PendingDocumentsResponse {
  // Granular counts for badge display
  costs: number
  invoices: number
  receipts: number
  deliverables: number
  total: number
  // Existing fields (backward compatibility)
  totalPending: number
  projects: ProjectPendingSummary[]
  claudeCommand: string
}

// GET /api/ai/pending - Get summary of documents pending AI analysis across all projects
export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  try {
    // Query all granular counts in parallel
    const [costsCount, invoicesCount, receiptsCount, deliverablesCount] =
      await Promise.all([
        // Costs with supplier but no normalizedItem
        prisma.cost.count({
          where: {
            supplierId: { not: null },
            normalizedItem: null,
          },
        }),
        // Pending invoices
        prisma.document.count({
          where: {
            category: 'INVOICE',
            aiStatus: 'PENDING',
          },
        }),
        // Pending receipts
        prisma.document.count({
          where: {
            category: 'RECEIPT',
            aiStatus: 'PENDING',
          },
        }),
        // Projects with invoices but no aiExtracted deliverables
        prisma.project.count({
          where: {
            documents: {
              some: {
                category: 'INVOICE',
              },
            },
            deliverables: {
              none: {
                aiExtracted: true,
              },
            },
          },
        }),
      ])

    const total =
      costsCount + invoicesCount + receiptsCount + deliverablesCount

    // Query all pending documents (INVOICE and RECEIPT only)
    const pendingDocuments = await prisma.document.findMany({
      where: {
        aiStatus: 'PENDING',
        category: {
          in: ['INVOICE', 'RECEIPT'],
        },
      },
      select: {
        id: true,
        projectId: true,
        category: true,
        project: {
          select: {
            id: true,
            title: true,
            company: {
              select: { name: true },
            },
          },
        },
      },
    })

    // Group by project
    const projectMap = new Map<
      string,
      {
        id: string
        title: string
        company: string
        pendingInvoices: number
        pendingReceipts: number
      }
    >()

    for (const doc of pendingDocuments) {
      const projectId = doc.projectId
      let projectSummary = projectMap.get(projectId)

      if (!projectSummary) {
        projectSummary = {
          id: doc.project.id,
          title: doc.project.title,
          company: doc.project.company?.name || 'Internal',
          pendingInvoices: 0,
          pendingReceipts: 0,
        }
        projectMap.set(projectId, projectSummary)
      }

      if (doc.category === 'INVOICE') {
        projectSummary.pendingInvoices++
      } else if (doc.category === 'RECEIPT') {
        projectSummary.pendingReceipts++
      }
    }

    // Check for manifest.json existence for each project
    const projects: ProjectPendingSummary[] = []
    const projectSummaries = Array.from(projectMap.values())
    for (const summary of projectSummaries) {
      const manifestPath = path.join(
        UPLOADS_DIR,
        'projects',
        summary.id,
        'manifest.json'
      )
      const hasManifest = existsSync(manifestPath)

      projects.push({
        ...summary,
        hasManifest,
      })
    }

    // Sort by pending count (most pending first)
    projects.sort(
      (a, b) =>
        b.pendingInvoices +
        b.pendingReceipts -
        (a.pendingInvoices + a.pendingReceipts)
    )

    const totalPending = pendingDocuments.length

    // Ready-to-run Claude command
    const claudeCommand = `claude "Read .claude/prompts/bulk-analysis.md and process uploads/projects/"`

    const response: PendingDocumentsResponse = {
      // Granular counts
      costs: costsCount,
      invoices: invoicesCount,
      receipts: receiptsCount,
      deliverables: deliverablesCount,
      total,
      // Existing fields
      totalPending,
      projects,
      claudeCommand,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching pending documents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pending documents' },
      { status: 500 }
    )
  }
}
