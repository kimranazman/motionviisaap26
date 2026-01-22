'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Plus, Search, Filter, Building2 } from 'lucide-react'
import { INDUSTRY_PRESETS } from '@/lib/industry-presets'
import { CompanyDetailModal } from './company-detail-modal'

interface Company {
  id: string
  name: string
  industry: string | null
  website: string | null
  address: string | null
  phone: string | null
  notes: string | null
  createdAt: string | Date
  _count: {
    contacts: number
  }
}

interface CompanyListProps {
  initialData: Company[]
}

export function CompanyList({ initialData }: CompanyListProps) {
  const [companies, setCompanies] = useState(initialData)
  const [search, setSearch] = useState('')
  const [industryFilter, setIndustryFilter] = useState<string>('all')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Form state for creating new company
  const [newName, setNewName] = useState('')
  const [newIndustry, setNewIndustry] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch =
      search === '' ||
      company.name.toLowerCase().includes(search.toLowerCase())

    const matchesIndustry =
      industryFilter === 'all' || company.industry === industryFilter

    return matchesSearch && matchesIndustry
  })

  const refreshCompanies = async () => {
    const response = await fetch('/api/companies')
    if (response.ok) {
      const data = await response.json()
      setCompanies(data)
    }
  }

  const handleCreateCompany = async () => {
    if (!newName.trim()) return

    setIsCreating(true)
    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          industry: newIndustry || null,
          notes: newNotes.trim() || null,
        }),
      })

      if (response.ok) {
        setIsCreateOpen(false)
        setNewName('')
        setNewIndustry('')
        setNewNotes('')
        await refreshCompanies()
      }
    } catch (error) {
      console.error('Error creating company:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleRowClick = (companyId: string) => {
    setSelectedCompanyId(companyId)
    setIsDetailOpen(true)
  }

  const handleDetailClose = () => {
    setIsDetailOpen(false)
    setSelectedCompanyId(null)
  }

  const handleCompanyDeleted = async () => {
    handleDetailClose()
    await refreshCompanies()
  }

  const handleCompanyUpdated = async () => {
    await refreshCompanies()
  }

  const formatDate = (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={industryFilter} onValueChange={setIndustryFilter}>
            <SelectTrigger className="w-44">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              {INDUSTRY_PRESETS.map((industry) => (
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Company
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Company</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Company Name *
                </label>
                <Input
                  placeholder="Enter company name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Industry
                </label>
                <Select value={newIndustry} onValueChange={setNewIndustry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRY_PRESETS.map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Notes
                </label>
                <Textarea
                  placeholder="Add any notes about this company"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                onClick={handleCreateCompany}
                disabled={!newName.trim() || isCreating}
              >
                {isCreating ? 'Creating...' : 'Create Company'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <Card className="border border-gray-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="w-32">Industry</TableHead>
                <TableHead className="w-24 text-center">Contacts</TableHead>
                <TableHead className="w-32">Added</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.map((company) => (
                <TableRow
                  key={company.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleRowClick(company.id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
                        <Building2 className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {company.name}
                        </p>
                        {company.website && (
                          <p className="text-sm text-gray-500">
                            {company.website}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {company.industry || '-'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm text-gray-600">
                      {company._count.contacts}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-500">
                      {formatDate(company.createdAt)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}

              {filteredCompanies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                        <Building2 className="h-6 w-6 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-gray-900 font-medium">
                          No companies yet
                        </p>
                        <p className="text-gray-500 text-sm">
                          Add your first company to get started.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsCreateOpen(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Company
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary */}
      {filteredCompanies.length > 0 && (
        <div className="text-sm text-gray-500">
          Showing {filteredCompanies.length} of {companies.length} companies
        </div>
      )}

      {/* Detail Modal */}
      <CompanyDetailModal
        companyId={selectedCompanyId}
        open={isDetailOpen}
        onOpenChange={(open) => {
          if (!open) handleDetailClose()
        }}
        onDeleted={handleCompanyDeleted}
        onUpdated={handleCompanyUpdated}
      />
    </div>
  )
}
