// AI Categorization utilities for normalizing cost item names (Phase 36)
// Uses gpt-4o-mini to standardize product/service names for price comparison

import OpenAI from 'openai'

// Lazy initialization to avoid build-time errors when OPENAI_API_KEY is not set
let openai: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openai
}

const SYSTEM_PROMPT = `You are a product/service name normalizer for price comparison.

Your task: Convert supplier-specific line item descriptions into standardized category names.

Rules:
1. Remove quantities, units, measurements (e.g., "10 pcs", "5kg", "2 hours")
2. Remove supplier-specific variations (brand names, model numbers unless essential)
3. Keep essential identifiers (size, grade, type, material)
4. Use Title Case
5. Keep it concise: 3-6 words maximum
6. For services, prefix with category (e.g., "Transportation - Taxi", "Labor - Setup Crew")
7. For products, use generic names (e.g., "Steel Pipe 2 Inch" not "ABC Brand Steel Pipe 2" Model X")

Examples:
- "10 pcs ABC Brand USB-C Cables 1m" -> "USB-C Cable 1m"
- "Taxi fare from KLIA to venue - RM85" -> "Transportation - Taxi"
- "5 bags Portland Cement 50kg" -> "Portland Cement 50kg"
- "Setup crew 8 pax x 4 hours" -> "Labor - Setup Crew"
- "Rental: 10x Round Tables 6ft" -> "Table Rental - Round 6ft"
- "LED Stage Lighting Package (complete)" -> "LED Stage Lighting Package"

Respond with ONLY the normalized name, no explanations.`

/**
 * Get normalized item name for a cost description
 * Uses AI to standardize product/service names for price comparison
 */
export async function getNormalizedItem(description: string): Promise<string> {
  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0, // Consistent outputs
      max_tokens: 50,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: description },
      ],
    })

    const result = response.choices[0]?.message?.content?.trim()

    // Return AI result or fallback to original description
    return result || description
  } catch (error) {
    console.error('AI categorization failed:', error)
    // Fallback to original description on error
    return description
  }
}
