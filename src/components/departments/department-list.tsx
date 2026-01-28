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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, Search, Filter, Building, MoreHorizontal, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CompanySelect } from '@/components/pipeline/company-select'
import { DepartmentDetailModal } from './department-detail-modal'

interface Department {
  id: string
  name: string
  description: string | null
  company: { id: string; name: string }
  _count: {
    contacts: number
    deals: number
    potentials: number
  }
  createdAt: string | Date
}

interface DepartmentListProps {
  initialData: Department[]
  companies: { id: string; name: string }[]
}

export function DepartmentList({ initialData, companies }: DepartmentListProps) {
  const [departments, setDepartments] = useState(initialData)
  const [search, setSearch] = useState('')
  const [companyFilter, setCompanyFilter] = useState<string>('all')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Create form state
  const [newCompanyId, setNewCompanyId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const filteredDepartments = departments.filter((dept) => {
    const matchesSearch =
      search === '' ||
      dept.name.toLowerCase().includes(search.toLowerCase())

    const matchesCompany =
      companyFilter === 'all' || dept.company.id === companyFilter

    return matchesSearch && matchesCompany
  })

  const refreshDepartments = async () => {
    const response = await fetch('/api/departments')
    if (response.ok) {
      const data = await response.json()
      setDepartments(data)
    }
  }

  const handleCreateDepartment = async () => {
    if (!newCompanyId || !newName.trim()) return

    setIsCreating(true)
    try {
      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: newCompanyId,
          name: newName.trim(),
          description: newDescription.trim() || null,
        }),
      })

      if (response.ok) {
        setIsCreateOpen(false)
        setNewCompanyId(null)
        setNewName('')
        setNewDescription('')
        await refreshDepartments()
      }
    } catch (error) {
      console.error('Error creating department:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleRowClick = (deptId: string) => {
    setSelectedDeptId(deptId)
    setIsDetailOpen(true)
  }

  const handleDetailClose = () => {
    setIsDetailOpen(false)
    setSelectedDeptId(null)
  }

  const handleDeleted = async () => {
    handleDetailClose()
    await refreshDepartments()
  }

  const handleUpdated = async () => {
    await refreshDepartments()
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-3 sm:gap-4">
          <div className="relative flex-1 sm:max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search departments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={companyFilter} onValueChange={setCompanyFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Company" />
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

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Department
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Department</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Company *
                </label>
                <CompanySelect
                  value={newCompanyId}
                  onValueChange={setNewCompanyId}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Department Name *
                </label>
                <Input
                  placeholder="e.g., Marketing, Engineering"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Description
                </label>
                <Textarea
                  placeholder="Optional description..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                onClick={handleCreateDepartment}
                disabled={!newCompanyId || !newName.trim() || isCreating}
              >
                {isCreating ? 'Creating...' : 'Create Department'}
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
                <TableHead className="hidden md:table-cell w-40">Company</TableHead>
                <TableHead className="hidden md:table-cell w-24 text-center">Contacts</TableHead>
                <TableHead className="hidden md:table-cell w-24 text-center">Deals</TableHead>
                <TableHead className="w-16">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDepartments.map((dept) => (
                <TableRow
                  key={dept.id}
                  className="group cursor-pointer hover:bg-gray-50"
                  onClick={() => handleRowClick(dept.id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50">
                        <Building className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {dept.name}
                        </p>
                        {dept.description && (
                          <p className="text-sm text-gray-500 line-clamp-1">
                            {dept.description}
                          </p>
                        )}
                        <p className="text-sm text-gray-500 md:hidden">
                          {dept.company.name}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm text-gray-600">
                      {dept.company.name}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-center">
                    <span className="text-sm text-gray-600">
                      {dept._count.contacts}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-center">
                    <span className="text-sm text-gray-600">
                      {dept._count.deals}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-8 w-8",
                            "md:opacity-0 md:group-hover:opacity-100",
                            "focus:opacity-100 transition-opacity"
                          )}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleRowClick(dept.id)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}

              {filteredDepartments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                        <Building className="h-6 w-6 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-gray-900 font-medium">
                          No departments yet
                        </p>
                        <p className="text-gray-500 text-sm">
                          Add your first department to get started.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsCreateOpen(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Department
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
      {filteredDepartments.length > 0 && (
        <div className="text-sm text-gray-500">
          <span className="hidden sm:inline">Showing </span>
          {filteredDepartments.length} of {departments.length}
          <span className="hidden sm:inline"> departments</span>
        </div>
      )}

      {/* Detail Modal */}
      <DepartmentDetailModal
        departmentId={selectedDeptId}
        open={isDetailOpen}
        onOpenChange={(open) => {
          if (!open) handleDetailClose()
        }}
        onDeleted={handleDeleted}
        onUpdated={handleUpdated}
      />
    </div>
  )
}
