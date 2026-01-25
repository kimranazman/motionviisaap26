// OpenAI Embedding utilities for semantic matching (Phase 35)
// Uses text-embedding-3-small for cost line item similarity

import OpenAI from 'openai'
import type { ConfidenceLevel } from '@/types/ai-extraction'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Generate embedding vector for a text string
 * Returns 1536-dimensional float array
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8000), // Max 8191 tokens
    encoding_format: 'float',
  })
  return response.data[0].embedding
}

/**
 * Calculate cosine similarity between two embedding vectors
 * OpenAI embeddings are pre-normalized, so dot product = cosine similarity
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  return a.reduce((sum, val, i) => sum + val * b[i], 0)
}

/**
 * Get confidence level from similarity score
 */
export function getConfidenceLevel(similarity: number): ConfidenceLevel {
  if (similarity >= 0.85) return 'HIGH'
  if (similarity >= 0.7) return 'MEDIUM'
  return 'LOW'
}
