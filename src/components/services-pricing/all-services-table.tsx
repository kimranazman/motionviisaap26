'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
import { Search, X, Package, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface ServiceDeliverable {
  id: string
  title: string
  description: string | null
  value: number | null
  aiExtracted: boolean
  project: {
    id: string
    title: string
    company: { id: string; name: string } | null
  }
  createdAt: string
}

interface AllServicesTableProps {
  initialServices: ServiceDeliverable[]
  companies: { id: string; name: string }[]
}

type SortField = 'value' | 'date'
type SortDirection = 'asc' | 'desc'

export function AllServicesTable({
  initialServices,
  companies,
}: AllServicesTableProps) {
  const [search, setSearch] = useState('')
  const [companyFilter, setCompanyFilter] = useState<string | null>(null)
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const filteredAndSorted = useMemo(() => {
    let result = [...initialServices]

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase()
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(searchLower) ||
          s.description?.toLowerCase().includes(searchLower)
      )
    }

    // Company filter
    if (companyFilter) {
      result = result.filter((s) => s.project.company?.id === companyFilter)
    }

    // Sort
    result.sort((a, b) => {
      if (sortField === 'value') {
        const aVal = a.value ?? 0
        const bVal = b.value ?? 0
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      } else {
        const aDate = new Date(a.createdAt).getTime()
        const bDate = new Date(b.createdAt).getTime()
        return sortDirection === 'asc' ? aDate - bDate : bDate - aDate
      }
    })

    return result
  }, [initialServices, search, companyFilter, sortField, sortDirection])

  const hasFilters = search || companyFilter

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 text-gray-400" />
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1" />
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={companyFilter ?? 'all'}
          onValueChange={(v) => setCompanyFilter(v === 'all' ? null : v)}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {companies.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch('')
              setCompanyFilter(null)
            }}
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Summary */}
      <div className="text-sm text-gray-500">
        Showing {filteredAndSorted.length} of {initialServices.length} services
      </div>

      {/* Table */}
      <Card className="border border-gray-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[20%]">Service Title</TableHead>
                <TableHead className="hidden md:table-cell w-[20%]">
                  Description
                </TableHead>
                <TableHead className="w-[12%]">
                  <button
                    onClick={() => toggleSort('value')}
                    className="flex items-center font-medium hover:text-gray-900"
                  >
                    Value
                    {getSortIcon('value')}
                  </button>
                </TableHead>
                <TableHead className="hidden md:table-cell w-[15%]">
                  Project
                </TableHead>
                <TableHead className="hidden lg:table-cell w-[15%]">
                  Client
                </TableHead>
                <TableHead className="w-[12%]">
                  <button
                    onClick={() => toggleSort('date')}
                    className="flex items-center font-medium hover:text-gray-900"
                  >
                    Date
                    {getSortIcon('date')}
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSorted.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>
                    <p className="font-medium text-gray-900 line-clamp-2">
                      {service.title}
                    </p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {service.description || '-'}
                    </p>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">
                      {service.value !== null
                        ? formatCurrency(service.value)
                        : '-'}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm text-gray-600">
                      {service.project.title}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-sm text-gray-600">
                      {service.project.company?.name || '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-500">
                      {new Date(service.createdAt).toLocaleDateString('en-MY', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </TableCell>
                </TableRow>
              ))}

              {filteredAndSorted.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                        <Package className="h-6 w-6 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-gray-900 font-medium">
                          No services found
                        </p>
                        <p className="text-gray-500 text-sm">
                          {hasFilters
                            ? 'Try adjusting your search or filters'
                            : 'No deliverables with pricing yet'}
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
    </div>
  )
}
