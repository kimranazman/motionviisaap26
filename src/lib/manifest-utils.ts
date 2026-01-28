// Manifest generation utilities for AI Document Intelligence (Phase 25)
// Generates manifest.json files for Claude Code to read when analyzing documents

import prisma from '@/lib/prisma'
import {
  ProjectManifest,
  ManifestDocument,
  ManifestCost,
} from '@/types/ai-extraction'
import { writeFile, readFile, mkdir } from 'fs/promises'
import path from 'path'

// Match the UPLOADS_DIR from documents route
const UPLOADS_DIR = process.env.UPLOADS_DIR || '/app/uploads'

/**
 * Generate a manifest.json file for a project
 * Contains project context, categories, and document list for AI analysis
 */
export async function generateProjectManifest(
  projectId: string
): Promise<ProjectManifest> {
  // Fetch project with company, costs, and documents
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      company: { select: { name: true } },
      costs: {
        include: { category: { select: { id: true, name: true } } },
        orderBy: { date: 'desc' },
        take: 20, // Last 20 costs for context
      },
      documents: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!project) {
    throw new Error(`Project not found: ${projectId}`)
  }

  // Fetch all cost categories for AI to use
  const categories = await prisma.costCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, name: true },
  })

  // Split documents by AI status
  const pendingAnalysis: ManifestDocument[] = []
  const alreadyAnalyzed: ManifestDocument[] = []

  for (const doc of project.documents) {
    const manifestDoc: ManifestDocument = {
      id: doc.id,
      filename: doc.filename,
      category: doc.category as 'RECEIPT' | 'INVOICE' | 'OTHER',
      path: doc.storagePath,
      mimeType: doc.mimeType,
      size: doc.size,
      uploadedAt: doc.createdAt.toISOString(),
      aiStatus: doc.aiStatus as 'PENDING' | 'ANALYZED' | 'IMPORTED' | 'FAILED',
    }

    if (doc.aiStatus === 'PENDING') {
      pendingAnalysis.push(manifestDoc)
    } else {
      alreadyAnalyzed.push(manifestDoc)
    }
  }

  // Format existing costs for context
  const existingCosts: ManifestCost[] = project.costs.map((cost) => ({
    description: cost.description,
    amount: Number(cost.amount),
    category: cost.category.name,
    date: cost.date.toISOString().split('T')[0],
  }))

  // Build manifest object
  const manifest: ProjectManifest = {
    version: '1.0',
    generatedAt: new Date().toISOString(),
    project: {
      id: project.id,
      title: project.title,
      company: project.company?.name || 'Internal',
      startDate: project.startDate?.toISOString().split('T')[0],
      endDate: project.endDate?.toISOString().split('T')[0],
      status: project.status,
    },
    existingCategories: categories,
    documents: {
      pendingAnalysis,
      alreadyAnalyzed,
    },
    existingCosts,
  }

  // Ensure project directory exists
  const projectDir = path.join(UPLOADS_DIR, 'projects', projectId)
  await mkdir(projectDir, { recursive: true })

  // Write manifest file
  const manifestPath = path.join(projectDir, 'manifest.json')
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8')

  return manifest
}

/**
 * Read existing manifest.json for a project
 * Returns null if manifest doesn't exist
 */
export async function getProjectManifest(
  projectId: string
): Promise<ProjectManifest | null> {
  try {
    const manifestPath = path.join(
      UPLOADS_DIR,
      'projects',
      projectId,
      'manifest.json'
    )
    const content = await readFile(manifestPath, 'utf-8')
    return JSON.parse(content) as ProjectManifest
  } catch {
    // File doesn't exist or can't be read
    return null
  }
}
