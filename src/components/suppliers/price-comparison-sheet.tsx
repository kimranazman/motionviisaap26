'use client'

import { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { CONFIDENCE_COLORS } from '@/components/ai/confidence-badge'
import type { SimilarCostItem } from '@/types/price-comparison'

interface PriceComparisonSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  costDescription: string
  costId: string
  costAmount: number
  currentSupplier: string
}

export function PriceComparisonSheet({
  open,
  onOpenChange,
  costDescription,
  costId,
  costAmount,
  currentSupplier,
}: PriceComparisonSheetProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<SimilarCostItem[]>([])
  const [searchedCount, setSearchedCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    setIsLoading(true)
    setError(null)
    setResults([])

    fetch('/api/suppliers/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: costDescription,
        excludeCostId: costId,
        limit: 10,
      }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to compare prices')
        }
        return response.json()
      })
      .then((data) => {
        setResults(data.results)
        setSearchedCount(data.searchedCount)
      })
      .catch((err) => {
        console.error('Price comparison failed:', err)
        setError(err instanceof Error ? err.message : 'Failed to compare prices')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [open, costDescription, costId])

  // Calculate price difference
  const getPriceDiff = (compareAmount: number) => {
    const diff = costAmount - compareAmount
    const percentDiff = ((diff / costAmount) * 100).toFixed(0)

    if (Math.abs(diff) < 0.01) {
      return { type: 'same' as const, text: 'Same price', diff: 0 }
    } else if (diff > 0) {
      return { type: 'cheaper' as const, text: `${percentDiff}% cheaper`, diff }
    } else {
      return { type: 'expensive' as const, text: `${Math.abs(Number(percentDiff))}% more`, diff: Math.abs(diff) }
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle className="text-left">Compare Prices</SheetTitle>
          <div className="space-y-2 mt-2">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {costDescription}
            </p>
            <div className="flex items-center gap-3 text-sm">
              <span className="font-semibold text-lg">{formatCurrency(costAmount)}</span>
              <Badge variant="outline">{currentSupplier}</Badge>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-3" />
                <p className="text-sm">Finding similar items...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-600">
                <p className="text-sm">{error}</p>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-sm">No similar items found from other suppliers</p>
                <p className="text-xs mt-1">Try adding more costs with suppliers to build comparison data</p>
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((item) => {
                  const priceDiff = getPriceDiff(item.amount)
                  const confidenceConfig = CONFIDENCE_COLORS[item.confidence]
                  const matchPercent = Math.round(item.similarity * 100)

                  return (
                    <div
                      key={item.id}
                      className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm line-clamp-2">
                            {item.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">
                              {item.supplier.name}
                            </span>
                            {item.project && (
                              <>
                                <span>-</span>
                                <span className="truncate">{item.project.title}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-semibold">{formatCurrency(item.amount)}</p>
                          <Badge
                            variant="outline"
                            className={cn('mt-1', confidenceConfig.badge)}
                          >
                            {matchPercent}% match
                          </Badge>
                        </div>
                      </div>

                      {/* Price difference indicator */}
                      <div
                        className={cn(
                          'mt-3 pt-3 border-t flex items-center gap-2 text-sm',
                          priceDiff.type === 'cheaper' && 'text-green-600',
                          priceDiff.type === 'expensive' && 'text-red-600',
                          priceDiff.type === 'same' && 'text-muted-foreground'
                        )}
                      >
                        {priceDiff.type === 'cheaper' && (
                          <>
                            <TrendingDown className="h-4 w-4" />
                            <span>{priceDiff.text}</span>
                            <span className="text-xs">
                              (Save {formatCurrency(priceDiff.diff)})
                            </span>
                          </>
                        )}
                        {priceDiff.type === 'expensive' && (
                          <>
                            <TrendingUp className="h-4 w-4" />
                            <span>{priceDiff.text}</span>
                            <span className="text-xs">
                              ({formatCurrency(priceDiff.diff)} more)
                            </span>
                          </>
                        )}
                        {priceDiff.type === 'same' && (
                          <>
                            <Minus className="h-4 w-4" />
                            <span>{priceDiff.text}</span>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </ScrollArea>

        {!isLoading && !error && (
          <div className="p-4 border-t text-xs text-muted-foreground text-center">
            Searched {searchedCount} items, found {results.length} matches
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
