'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Loader2, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface PricingCost {
  id: string
  description: string
  normalizedItem: string | null
  amount: number
  quantity: number | null
  unitPrice: number | null
  date: string
  supplier: { id: string; name: string } | null
  project: {
    id: string
    title: string
    company: { id: string; name: string } | null
  } | null
}

interface PricingHistoryByItemProps {
  normalizedItems: string[]
}

export function PricingHistoryByItem({
  normalizedItems,
}: PricingHistoryByItemProps) {
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [costs, setCosts] = useState<PricingCost[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const params = new URLSearchParams({ view: 'by-item' })
        if (selectedItem) {
          params.set('item', selectedItem)
        }
        const response = await fetch(`/api/pricing-history?${params}`)
        if (response.ok) {
          const data = await response.json()
          setCosts(data.costs)
        }
      } catch (error) {
        console.error('Failed to fetch pricing history:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [selectedItem])

  const stats = useMemo(() => {
    if (costs.length === 0) return null
    const amounts = costs.map((c) => c.amount)
    const unitPrices = costs
      .map((c) => c.unitPrice)
      .filter((p): p is number => p !== null)
    const pricesForStats = unitPrices.length > 0 ? unitPrices : amounts
    return {
      count: costs.length,
      min: Math.min(...pricesForStats),
      max: Math.max(...pricesForStats),
      avg: pricesForStats.reduce((s, v) => s + v, 0) / pricesForStats.length,
      label: unitPrices.length > 0 ? 'Unit Price' : 'Total',
    }
  }, [costs])

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <Select
          value={selectedItem ?? 'all'}
          onValueChange={(value) =>
            setSelectedItem(value === 'all' ? null : value)
          }
        >
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="All Normalized Items" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Normalized Items</SelectItem>
            {normalizedItems.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">Entries</div>
              <div className="text-lg font-semibold">{stats.count}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">
                Min {stats.label}
              </div>
              <div className="text-lg font-semibold text-green-600">
                {formatCurrency(stats.min)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">
                Max {stats.label}
              </div>
              <div className="text-lg font-semibold text-red-600">
                {formatCurrency(stats.max)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">
                Avg {stats.label}
              </div>
              <div className="text-lg font-semibold">
                {formatCurrency(stats.avg)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <Card className="border border-gray-200">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[25%]">Description</TableHead>
                  {!selectedItem && (
                    <TableHead className="hidden md:table-cell w-[15%]">
                      Item
                    </TableHead>
                  )}
                  <TableHead className="w-[8%]">Qty</TableHead>
                  <TableHead className="w-[12%]">Unit Price</TableHead>
                  <TableHead className="w-[12%]">Total</TableHead>
                  <TableHead className="hidden md:table-cell w-[15%]">
                    Supplier
                  </TableHead>
                  <TableHead className="hidden md:table-cell w-[15%]">
                    Project
                  </TableHead>
                  <TableHead className="hidden sm:table-cell w-[10%]">
                    Date
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costs.map((cost) => (
                  <TableRow key={cost.id}>
                    <TableCell>
                      <p className="font-medium text-gray-900 line-clamp-2">
                        {cost.description}
                      </p>
                    </TableCell>
                    {!selectedItem && (
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm text-gray-600">
                          {cost.normalizedItem || '-'}
                        </span>
                      </TableCell>
                    )}
                    <TableCell>
                      <span className="text-sm">
                        {cost.quantity != null ? cost.quantity : '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {cost.unitPrice != null
                          ? formatCurrency(cost.unitPrice)
                          : '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {formatCurrency(cost.amount)}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm text-gray-600">
                        {cost.supplier?.name || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm text-gray-600">
                        {cost.project?.title || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="text-sm text-gray-500">
                        {new Date(cost.date).toLocaleDateString('en-MY', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}

                {costs.length === 0 && !loading && (
                  <TableRow>
                    <TableCell
                      colSpan={selectedItem ? 7 : 8}
                      className="text-center py-12"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                          <TrendingUp className="h-6 w-6 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-gray-900 font-medium">
                            No pricing data found
                          </p>
                          <p className="text-gray-500 text-sm">
                            {selectedItem
                              ? `No costs with normalized item "${selectedItem}"`
                              : 'No costs with normalized items yet. Use AI analysis to assign normalized item names.'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
