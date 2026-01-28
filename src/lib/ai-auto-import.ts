import prisma from '@/lib/prisma'
import { readFile } from 'fs/promises'
import { join } from 'path'
import type { ConfidenceLevel } from '@/types/ai-extraction'

const UPLOADS_DIR = process.env.UPLOADS_DIR || 'uploads'

interface AIResults {
  documentId: string
  storagePath?: string
  type: 'invoice' | 'receipt'
  confidence: ConfidenceLevel
  // Invoice fields
  invoiceNumber?: string
  invoiceDate?: string
  vendor?: string
  lineItems?: Array<{
    description: string
    quantity?: number
    unitPrice?: number
    amount: number
    confidence: ConfidenceLevel
  }>
  subtotal?: number
  tax?: number
  total?: number
  // Receipt fields
  receiptDate?: string
  merchant?: string
  items?: Array<{
    description: string
    amount: number
    quantity?: number
    unitPrice?: number
    suggestedCategory?: string
    confidence: ConfidenceLevel
  }>
}

interface AutoImportResult {
  success: boolean
  action: 'imported' | 'needs_review' | 'skipped' | 'error'
  confidence: ConfidenceLevel
  type?: 'invoice' | 'receipt'
  message: string
  revenueAdded?: number
  costsCreated?: number
  error?: string
}

/**
 * Auto-import AI extraction results if confidence is HIGH.
 * Called after AI analysis writes ai-results.json to project folder.
 */
export async function autoImportIfHighConfidence(
  projectId: string,
  documentId: string
): Promise<AutoImportResult> {
  try {
    // Read ai-results.json
    const resultsPath = join(process.cwd(), UPLOADS_DIR, 'projects', projectId, 'ai-results.json')
    let resultsContent: string

    try {
      resultsContent = await readFile(resultsPath, 'utf-8')
    } catch {
      return {
        success: false,
        action: 'skipped',
        confidence: 'LOW',
        message: 'No AI results file found',
      }
    }

    const results: AIResults = JSON.parse(resultsContent)

    // Check confidence level
    if (results.confidence !== 'HIGH') {
      // Mark as ANALYZED, needs manual review
      await prisma.document.update({
        where: { id: documentId },
        data: {
          aiStatus: 'ANALYZED',
          aiAnalyzedAt: new Date(),
        },
      })

      return {
        success: true,
        action: 'needs_review',
        confidence: results.confidence,
        type: results.type,
        message: `${results.confidence} confidence - requires manual review`,
      }
    }

    // HIGH confidence - auto-import
    if (results.type === 'invoice') {
      return await autoImportInvoice(projectId, documentId, results)
    } else if (results.type === 'receipt') {
      return await autoImportReceipt(projectId, documentId, results)
    }

    return {
      success: false,
      action: 'error',
      confidence: results.confidence,
      message: `Unknown document type: ${results.type}`,
    }
  } catch (error) {
    console.error('Auto-import error:', error)
    return {
      success: false,
      action: 'error',
      confidence: 'LOW',
      message: 'Auto-import failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Auto-import invoice data with HIGH confidence
 */
async function autoImportInvoice(
  projectId: string,
  documentId: string,
  results: AIResults
): Promise<AutoImportResult> {
  if (!results.total) {
    return {
      success: false,
      action: 'error',
      confidence: 'HIGH',
      type: 'invoice',
      message: 'Invoice has no total amount',
    }
  }

  // Get project
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, revenue: true, potentialRevenue: true },
  })

  if (!project) {
    return {
      success: false,
      action: 'error',
      confidence: 'HIGH',
      type: 'invoice',
      message: 'Project not found',
    }
  }

  // Replace revenue with AI-extracted amount (invoice is the source of truth)
  // potentialRevenue may have been set from deal/potential conversion (estimate)
  // revenue is now set by AI invoice import only (actuals)
  await prisma.project.update({
    where: { id: projectId },
    data: {
      revenue: results.total, // Only set actual revenue
    },
  })

  // Update document status
  await prisma.document.update({
    where: { id: documentId },
    data: {
      aiStatus: 'IMPORTED',
      aiAnalyzedAt: new Date(),
    },
  })

  return {
    success: true,
    action: 'imported',
    confidence: 'HIGH',
    type: 'invoice',
    message: `Auto-imported invoice: RM ${results.total.toLocaleString()}`,
    revenueAdded: results.total,
  }
}

/**
 * Auto-import receipt data with HIGH confidence
 */
async function autoImportReceipt(
  projectId: string,
  documentId: string,
  results: AIResults
): Promise<AutoImportResult> {
  if (!results.items || results.items.length === 0) {
    return {
      success: false,
      action: 'error',
      confidence: 'HIGH',
      type: 'receipt',
      message: 'Receipt has no items',
    }
  }

  // Get or create "Other" category as fallback
  let fallbackCategory = await prisma.costCategory.findFirst({
    where: { name: { equals: 'Other' } },
    select: { id: true },
  })

  if (!fallbackCategory) {
    fallbackCategory = await prisma.costCategory.create({
      data: { name: 'Other', description: 'Uncategorized expenses' },
      select: { id: true },
    })
  }

  // Category cache
  const categoryCache = new Map<string, string>()
  const costDate = results.receiptDate ? new Date(results.receiptDate) : new Date()

  let costsCreated = 0

  for (const item of results.items) {
    let categoryId: string | null = null

    // Try to find/create category from suggestion
    if (item.suggestedCategory) {
      const normalizedName = item.suggestedCategory.toLowerCase()

      if (categoryCache.has(normalizedName)) {
        categoryId = categoryCache.get(normalizedName)!
      } else {
        // Look for existing category
        const activeCategories = await prisma.costCategory.findMany({
          where: { isActive: true },
          select: { id: true, name: true },
        })

        const existingCategory = activeCategories.find(
          (cat) => cat.name.toLowerCase() === normalizedName
        )

        if (existingCategory) {
          categoryId = existingCategory.id
          categoryCache.set(normalizedName, existingCategory.id)
        } else {
          // Create new category
          const maxSortOrder = await prisma.costCategory.findFirst({
            orderBy: { sortOrder: 'desc' },
            select: { sortOrder: true },
          })

          const newCategory = await prisma.costCategory.create({
            data: {
              name: item.suggestedCategory,
              description: 'AI-suggested category',
              sortOrder: (maxSortOrder?.sortOrder ?? 0) + 1,
            },
            select: { id: true },
          })

          categoryId = newCategory.id
          categoryCache.set(normalizedName, newCategory.id)
        }
      }
    }

    // Use fallback if no category
    if (!categoryId) {
      categoryId = fallbackCategory.id
    }

    // Create cost entry with AI flag
    await prisma.cost.create({
      data: {
        projectId,
        description: item.description,
        amount: item.amount,
        quantity: item.quantity ?? null,
        unitPrice: item.unitPrice ?? null,
        categoryId,
        date: costDate,
        aiImported: true,
      },
    })

    costsCreated++
  }

  // Update document status
  await prisma.document.update({
    where: { id: documentId },
    data: {
      aiStatus: 'IMPORTED',
      aiAnalyzedAt: new Date(),
    },
  })

  const totalAmount = results.items.reduce((sum, item) => sum + item.amount, 0)

  return {
    success: true,
    action: 'imported',
    confidence: 'HIGH',
    type: 'receipt',
    message: `Auto-imported ${costsCreated} cost entries: RM ${totalAmount.toLocaleString()}`,
    costsCreated,
  }
}
