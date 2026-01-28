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
import { Loader2, Building2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface ClientCost {
  id: string
  description: string
  normalizedItem: string | null
  amount: number
  quantity: number | null
  unitPrice: number | null
  date: string
  category: { id: string; name: string }
  supplier: { id: string; name: string } | null
  project: {
    id: string
    title: string
    company: { id: string; name: string } | null
  } | null
}

interface PricingHistoryByClientProps {
  companies: { id: string; name: string }[]
}

export function PricingHistoryByClient({
  companies,
}: PricingHistoryByClientProps) {
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)
  const [costs, setCosts] = useState<ClientCost[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const params = new URLSearchParams({ view: 'by-client' })
        if (selectedCompany) {
          params.set('companyId', selectedCompany)
        }
        const response = await fetch(`/api/pricing-history?${params}`)
        if (response.ok) {
          const data = await response.json()
          setCosts(data.costs)
        }
      } catch (error) {
        console.error('Failed to fetch client pricing:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [selectedCompany])

  const stats = useMemo(() => {
    if (costs.length === 0) return null
    const totalSpend = costs.reduce((sum, c) => sum + c.amount, 0)
    return {
      count: costs.length,
      totalSpend,
    }
  }, [costs])

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <Select
          value={selectedCompany ?? 'all'}
          onValueChange={(value) =>
            setSelectedCompany(value === 'all' ? null : value)
          }
        >
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="All Companies" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Companies</SelectItem>
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">Cost Entries</div>
              <div className="text-lg font-semibold">{stats.count}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">Total Spend</div>
              <div className="text-lg font-semibold">
                {formatCurrency(stats.totalSpend)}
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
                  <TableHead className="w-[22%]">Description</TableHead>
                  <TableHead className="hidden md:table-cell w-[12%]">
                    Category
                  </TableHead>
                  <TableHead className="w-[8%]">Qty</TableHead>
                  <TableHead className="w-[11%]">Unit Price</TableHead>
                  <TableHead className="w-[11%]">Amount</TableHead>
                  <TableHead className="hidden md:table-cell w-[12%]">
                    Supplier
                  </TableHead>
                  <TableHead className="hidden md:table-cell w-[14%]">
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
                      <p className="text-xs text-gray-500 md:hidden mt-0.5">
                        {cost.category.name}
                      </p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm text-gray-600">
                        {cost.category.name}
                      </span>
                    </TableCell>
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
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                          <Building2 className="h-6 w-6 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-gray-900 font-medium">
                            No client costs found
                          </p>
                          <p className="text-gray-500 text-sm">
                            {selectedCompany
                              ? 'No cost entries for this company'
                              : 'No projects with company associations have costs yet'}
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
