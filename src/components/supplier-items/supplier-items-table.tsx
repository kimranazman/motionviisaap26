'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowUpDown, Search, Tag } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { NormalizedItemEdit } from './normalized-item-edit'

interface SupplierItem {
  id: string
  description: string
  normalizedItem: string | null
  amount: number
  date: string
  supplier: { id: string; name: string } | null
  project: { id: string; title: string } | null
}

interface SupplierItemsTableProps {
  initialItems: SupplierItem[]
  categories: string[]
  suppliers: { id: string; name: string }[]
}

export function SupplierItemsTable({
  initialItems,
  categories,
  suppliers,
}: SupplierItemsTableProps) {
  const [items, setItems] = useState(initialItems)
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [supplierFilter, setSupplierFilter] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [search, setSearch] = useState('')

  const filteredItems = useMemo(() => {
    let result = items

    // Filter by category
    if (categoryFilter) {
      result = result.filter((item) => item.normalizedItem === categoryFilter)
    }

    // Filter by supplier
    if (supplierFilter) {
      result = result.filter((item) => item.supplier?.id === supplierFilter)
    }

    // Filter by search (description or normalizedItem)
    if (search) {
      const searchLower = search.toLowerCase()
      result = result.filter(
        (item) =>
          item.description.toLowerCase().includes(searchLower) ||
          (item.normalizedItem?.toLowerCase().includes(searchLower) ?? false)
      )
    }

    // Sort by amount
    result = [...result].sort((a, b) => {
      if (sortDirection === 'asc') {
        return a.amount - b.amount
      }
      return b.amount - a.amount
    })

    return result
  }, [items, categoryFilter, supplierFilter, search, sortDirection])

  const handleNormalizedItemUpdate = (costId: string, newValue: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === costId ? { ...item, normalizedItem: newValue } : item
      )
    )
  }

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
  }

  const clearFilters = () => {
    setCategoryFilter(null)
    setSupplierFilter(null)
    setSearch('')
  }

  const hasFilters = categoryFilter || supplierFilter || search

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Category Filter */}
          <Select
            value={categoryFilter ?? 'all'}
            onValueChange={(value) =>
              setCategoryFilter(value === 'all' ? null : value)
            }
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Supplier Filter */}
          <Select
            value={supplierFilter ?? 'all'}
            onValueChange={(value) =>
              setSupplierFilter(value === 'all' ? null : value)
            }
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Suppliers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Suppliers</SelectItem>
              {suppliers.map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </div>

      {/* Table */}
      <Card className="border border-gray-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%]">Description</TableHead>
                <TableHead className="w-[20%]">Category</TableHead>
                <TableHead className="hidden md:table-cell w-[15%]">
                  Supplier
                </TableHead>
                <TableHead className="w-[15%]">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8 hover:bg-transparent"
                    onClick={toggleSortDirection}
                  >
                    Price
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="hidden md:table-cell w-[20%]">
                  Project
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900 line-clamp-2">
                        {item.description}
                      </p>
                      <p className="text-xs text-gray-500 md:hidden mt-1">
                        {item.supplier?.name}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <NormalizedItemEdit
                      costId={item.id}
                      value={item.normalizedItem}
                      onUpdate={(newValue) =>
                        handleNormalizedItemUpdate(item.id, newValue)
                      }
                    />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm text-gray-600">
                      {item.supplier?.name || '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'text-sm font-medium',
                        sortDirection === 'asc' ? 'text-green-600' : ''
                      )}
                    >
                      {formatCurrency(item.amount)}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm text-gray-600">
                      {item.project?.title || '-'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}

              {filteredItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                        <Tag className="h-6 w-6 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-gray-900 font-medium">
                          No items found
                        </p>
                        <p className="text-gray-500 text-sm">
                          {hasFilters
                            ? 'Try adjusting your filters'
                            : 'No supplier costs have been added yet'}
                        </p>
                      </div>
                      {hasFilters && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearFilters}
                        >
                          Clear filters
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary */}
      {filteredItems.length > 0 && (
        <div className="text-sm text-gray-500">
          <span className="hidden sm:inline">Showing </span>
          {filteredItems.length} of {items.length}
          <span className="hidden sm:inline"> items</span>
        </div>
      )}
    </div>
  )
}
