import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireEditor } from '@/lib/auth-utils'
import { ReceiptExtraction } from '@/types/ai-extraction'

interface ReceiptImportItem {
  description: string
  amount: number
  quantity?: number | null
  unitPrice?: number | null
  categoryId: string | null
  suggestedCategory?: string
  include: boolean
}

interface ReceiptImportRequest {
  projectId: string
  extraction: ReceiptExtraction
  items: ReceiptImportItem[]
}

interface CreatedCategory {
  id: string
  name: string
}

// POST /api/ai/import/receipt - Import AI-extracted receipt data as cost entries
export async function POST(request: NextRequest) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const body: ReceiptImportRequest = await request.json()
    const { projectId, extraction, items } = body

    // Validate required fields
    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      )
    }
    if (!extraction?.documentId) {
      return NextResponse.json(
        { error: 'extraction with documentId is required' },
        { status: 400 }
      )
    }
    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'items array is required' },
        { status: 400 }
      )
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Verify document exists
    const document = await prisma.document.findUnique({
      where: { id: extraction.documentId },
      select: { id: true, projectId: true, category: true },
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Verify document belongs to project
    if (document.projectId !== projectId) {
      return NextResponse.json(
        { error: 'Document does not belong to this project' },
        { status: 400 }
      )
    }

    // Verify document is a receipt
    if (document.category !== 'RECEIPT') {
      return NextResponse.json(
        { error: 'Document category must be RECEIPT' },
        { status: 400 }
      )
    }

    // Filter items that are included for import
    const itemsToImport = items.filter((item) => item.include)

    if (itemsToImport.length === 0) {
      return NextResponse.json(
        { error: 'No items selected for import' },
        { status: 400 }
      )
    }

    // Track categories created from AI suggestions
    const categoriesCreated: CreatedCategory[] = []
    // Map to cache category lookups/creations
    const categoryCache = new Map<string, string>()

    // Get date from extraction or use current date
    const costDate = extraction.receiptDate
      ? new Date(extraction.receiptDate)
      : new Date()

    // Process each item and create cost entries
    const createdCosts = []

    for (const item of itemsToImport) {
      let finalCategoryId: string | null = item.categoryId

      // If categoryId is null but suggestedCategory is provided, find or create category
      if (!finalCategoryId && item.suggestedCategory) {
        const normalizedName = item.suggestedCategory.toLowerCase()

        // Check cache first
        if (categoryCache.has(normalizedName)) {
          finalCategoryId = categoryCache.get(normalizedName)!
        } else {
          // Look for existing category (case-insensitive search)
          // Fetch all active categories and do case-insensitive comparison in JS
          // since MySQL with Prisma doesn't support mode: 'insensitive' filter
          const activeCategories = await prisma.costCategory.findMany({
            where: { isActive: true },
            select: { id: true, name: true },
          })

          const existingCategory = activeCategories.find(
            (cat) =>
              cat.name.toLowerCase() === item.suggestedCategory!.toLowerCase()
          )

          if (existingCategory) {
            finalCategoryId = existingCategory.id
            categoryCache.set(normalizedName, existingCategory.id)
          } else {
            // Create new category from AI suggestion
            const maxSortOrder = await prisma.costCategory.findFirst({
              orderBy: { sortOrder: 'desc' },
              select: { sortOrder: true },
            })
            const newSortOrder = (maxSortOrder?.sortOrder ?? 0) + 1

            const newCategory = await prisma.costCategory.create({
              data: {
                name: item.suggestedCategory,
                description: `AI-suggested category from receipt analysis`,
                sortOrder: newSortOrder,
                isActive: true,
              },
              select: { id: true, name: true },
            })

            finalCategoryId = newCategory.id
            categoryCache.set(normalizedName, newCategory.id)
            categoriesCreated.push({
              id: newCategory.id,
              name: newCategory.name,
            })
          }
        }
      }

      // If still no categoryId, we need to validate the provided one
      if (item.categoryId && item.categoryId !== finalCategoryId) {
        const validCategory = await prisma.costCategory.findUnique({
          where: { id: item.categoryId },
          select: { id: true, isActive: true },
        })

        if (!validCategory || !validCategory.isActive) {
          return NextResponse.json(
            { error: `Invalid category: ${item.categoryId}` },
            { status: 400 }
          )
        }
        finalCategoryId = item.categoryId
      }

      // Ensure we have a category before creating cost
      if (!finalCategoryId) {
        return NextResponse.json(
          {
            error: `No category for item: "${item.description}". Provide categoryId or suggestedCategory.`,
          },
          { status: 400 }
        )
      }

      // Create cost entry with AI import flag
      const cost = await prisma.cost.create({
        data: {
          projectId,
          description: item.description,
          amount: item.amount,
          quantity: item.quantity ?? null,
          unitPrice: item.unitPrice ?? null,
          categoryId: finalCategoryId,
          date: costDate,
          aiImported: true,
        },
        include: {
          category: { select: { id: true, name: true } },
        },
      })

      createdCosts.push({
        ...cost,
        amount: Number(cost.amount),
      })
    }

    // Update document status to IMPORTED
    const updatedDocument = await prisma.document.update({
      where: { id: extraction.documentId },
      data: {
        aiStatus: 'IMPORTED',
        aiAnalyzedAt: new Date(),
      },
      select: { id: true, aiStatus: true, aiAnalyzedAt: true },
    })

    return NextResponse.json({
      success: true,
      costsCreated: createdCosts.length,
      costs: createdCosts,
      categoriesCreated,
      document: {
        id: updatedDocument.id,
        aiStatus: updatedDocument.aiStatus,
        aiAnalyzedAt: updatedDocument.aiAnalyzedAt,
      },
    })
  } catch (error) {
    console.error('Error importing receipt:', error)
    return NextResponse.json(
      { error: 'Failed to import receipt' },
      { status: 500 }
    )
  }
}
