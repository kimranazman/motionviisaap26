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

interface ServicesByClientProps {
  companies: { id: string; name: string }[]
}

export function ServicesByClient({ companies }: ServicesByClientProps) {
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)
  const [services, setServices] = useState<ServiceDeliverable[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const params = new URLSearchParams({ view: 'by-client' })
        if (selectedCompany) {
          params.set('companyId', selectedCompany)
        }
        const response = await fetch(`/api/services-pricing?${params}`)
        if (response.ok) {
          const data = await response.json()
          setServices(data.deliverables)
        }
      } catch (error) {
        console.error('Failed to fetch services by client:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [selectedCompany])

  const stats = useMemo(() => {
    if (services.length === 0) return null
    const totalRevenue = services.reduce((sum, s) => sum + (s.value ?? 0), 0)
    return {
      count: services.length,
      totalRevenue,
    }
  }, [services])

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <Select
          value={selectedCompany ?? 'all'}
          onValueChange={(v) => setSelectedCompany(v === 'all' ? null : v)}
        >
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="All Clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
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
              <div className="text-xs text-muted-foreground">Service Count</div>
              <div className="text-lg font-semibold">{stats.count}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">Total Revenue</div>
              <div className="text-lg font-semibold">
                {formatCurrency(stats.totalRevenue)}
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
                  <TableHead className="w-[20%]">Service Title</TableHead>
                  <TableHead className="hidden md:table-cell w-[25%]">
                    Description
                  </TableHead>
                  <TableHead className="w-[12%]">Value</TableHead>
                  <TableHead className="hidden md:table-cell w-[18%]">
                    Project
                  </TableHead>
                  {!selectedCompany && (
                    <TableHead className="hidden lg:table-cell w-[15%]">
                      Client
                    </TableHead>
                  )}
                  <TableHead className="hidden sm:table-cell w-[12%]">
                    Date
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
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
                    {!selectedCompany && (
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-sm text-gray-600">
                          {service.project.company?.name || '-'}
                        </span>
                      </TableCell>
                    )}
                    <TableCell className="hidden sm:table-cell">
                      <span className="text-sm text-gray-500">
                        {new Date(service.createdAt).toLocaleDateString(
                          'en-MY',
                          {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          }
                        )}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}

                {services.length === 0 && !loading && (
                  <TableRow>
                    <TableCell
                      colSpan={selectedCompany ? 5 : 6}
                      className="text-center py-12"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                          <Building2 className="h-6 w-6 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-gray-900 font-medium">
                            No services found
                          </p>
                          <p className="text-gray-500 text-sm">
                            {selectedCompany
                              ? 'No deliverables for this client'
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
      )}
    </div>
  )
}
