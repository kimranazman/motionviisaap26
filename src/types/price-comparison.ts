// Price Comparison Types (Phase 35)
// Types for AI-powered semantic matching and price comparison

import type { ConfidenceLevel } from '@/types/ai-extraction'

// Similar cost item found through semantic matching
export interface SimilarCostItem {
  id: string
  description: string
  amount: number
  date: Date
  similarity: number // 0-1 score
  confidence: ConfidenceLevel
  supplier: {
    id: string
    name: string
  }
  project: {
    id: string
    title: string
  } | null
  category: {
    id: string
    name: string
  }
}

// Result of a price comparison query
export interface PriceComparisonResult {
  query: string // The description being compared
  queryCostId: string // The cost being compared
  results: SimilarCostItem[]
  searchedCount: number // Total costs searched
  matchedCount: number // Results above threshold
}
