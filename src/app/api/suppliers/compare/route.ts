import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-utils'
import { getEmbedding, cosineSimilarity, getConfidenceLevel } from '@/lib/embeddings'
import type { PriceComparisonResult, SimilarCostItem } from '@/types/price-comparison'
import { Prisma } from '@prisma/client'

// POST /api/suppliers/compare - Find similar costs across suppliers
export async function POST(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const body = await request.json()

    // Validate required fields
    if (!body.description?.trim()) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      )
    }

    const description = body.description.trim()
    const excludeCostId = body.excludeCostId || null
    const limit = Math.min(body.limit || 10, 50) // Cap at 50

    // Get embedding for query description
    const queryEmbedding = await getEmbedding(description)

    // Fetch all costs with suppliers (filter embedding in-memory for JSON compatibility)
    const costs = await prisma.cost.findMany({
      where: {
        supplierId: { not: null },
        embedding: { not: Prisma.JsonNull },
        ...(excludeCostId ? { id: { not: excludeCostId } } : {}),
      },
      include: {
        supplier: { select: { id: true, name: true } },
        project: { select: { id: true, title: true } },
        category: { select: { id: true, name: true } },
      },
    })

    // Calculate similarity for each cost (in-memory)
    const THRESHOLD = 0.7
    const similarCosts: SimilarCostItem[] = []

    for (const cost of costs) {
      // Parse embedding from JSON
      const costEmbedding = cost.embedding as number[] | null
      if (!costEmbedding || !Array.isArray(costEmbedding)) continue

      const similarity = cosineSimilarity(queryEmbedding, costEmbedding)

      // Filter by threshold
      if (similarity >= THRESHOLD && cost.supplier && cost.category) {
        similarCosts.push({
          id: cost.id,
          description: cost.description,
          amount: Number(cost.amount),
          date: cost.date,
          similarity,
          confidence: getConfidenceLevel(similarity),
          supplier: cost.supplier,
          project: cost.project,
          category: cost.category,
        })
      }
    }

    // Sort by similarity descending and take top results
    similarCosts.sort((a, b) => b.similarity - a.similarity)
    const results = similarCosts.slice(0, limit)

    const response: PriceComparisonResult = {
      query: description,
      queryCostId: excludeCostId || '',
      results,
      searchedCount: costs.length,
      matchedCount: results.length,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error comparing prices:', error)
    return NextResponse.json(
      { error: 'Failed to compare prices' },
      { status: 500 }
    )
  }
}
