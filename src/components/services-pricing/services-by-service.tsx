'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
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
import { DeliverableDetailSheet } from './deliverable-detail-sheet'

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

interface ServicesByServiceProps {
  serviceTitles: string[]
}

export function ServicesByService({ serviceTitles }: ServicesByServiceProps) {
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [services, setServices] = useState<ServiceDeliverable[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDeliverable, setSelectedDeliverable] = useState<ServiceDeliverable | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ view: 'by-service' })
      if (selectedService) {
        params.set('service', selectedService)
      }
      const response = await fetch(`/api/services-pricing?${params}`)
      if (response.ok) {
        const data = await response.json()
        setServices(data.deliverables)
      }
    } catch (error) {
      console.error('Failed to fetch services by service:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedService])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const stats = useMemo(() => {
    if (services.length === 0) return null
    const values = services
      .map((s) => s.value)
      .filter((v): v is number => v !== null)
    if (values.length === 0) return null
    return {
      count: services.length,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((sum, v) => sum + v, 0) / values.length,
    }
  }, [services])

  const handleRowClick = (service: ServiceDeliverable) => {
    setSelectedDeliverable(service)
    setDetailOpen(true)
  }

  const handleUpdate = () => {
    fetchData()
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <Select
          value={selectedService ?? 'all'}
          onValueChange={(v) => setSelectedService(v === 'all' ? null : v)}
        >
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="All Services" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            {serviceTitles.map((title) => (
              <SelectItem key={title} value={title}>
                {title}
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
              <div className="text-xs text-muted-foreground">Min Value</div>
              <div className="text-lg font-semibold text-green-600">
                {formatCurrency(stats.min)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">Max Value</div>
              <div className="text-lg font-semibold text-red-600">
                {formatCurrency(stats.max)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">Avg Value</div>
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
                  {!selectedService && (
                    <TableHead className="w-[18%]">Service</TableHead>
                  )}
                  <TableHead className={selectedService ? 'w-[30%]' : 'w-[22%]'}>
                    Description
                  </TableHead>
                  <TableHead className="w-[12%]">Value</TableHead>
                  <TableHead className="hidden md:table-cell w-[18%]">
                    Project
                  </TableHead>
                  <TableHead className="hidden md:table-cell w-[15%]">
                    Client
                  </TableHead>
                  <TableHead className="hidden sm:table-cell w-[12%]">
                    Date
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow
                    key={service.id}
                    onClick={() => handleRowClick(service)}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    {!selectedService && (
                      <TableCell>
                        <span className="text-sm font-medium text-gray-900">
                          {service.title}
                        </span>
                      </TableCell>
                    )}
                    <TableCell>
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
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm text-gray-600">
                        {service.project.company?.name || '-'}
                      </span>
                    </TableCell>
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
                      colSpan={selectedService ? 5 : 6}
                      className="text-center py-12"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                          <TrendingUp className="h-6 w-6 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-gray-900 font-medium">
                            No services found
                          </p>
                          <p className="text-gray-500 text-sm">
                            {selectedService
                              ? `No deliverables with title "${selectedService}"`
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

      {/* Detail Sheet */}
      <DeliverableDetailSheet
        deliverable={selectedDeliverable}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdate={handleUpdate}
      />
    </div>
  )
}
