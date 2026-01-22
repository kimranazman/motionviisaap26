'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { InitiativeForm } from './initiative-form'
import {
  cn,
  formatStatus,
  formatDepartment,
  formatTeamMember,
  formatDate,
  getStatusColor,
  STATUS_OPTIONS,
  DEPARTMENT_OPTIONS,
} from '@/lib/utils'
import { Plus, Search, Filter, Eye, MoreHorizontal } from 'lucide-react'

interface Initiative {
  id: string
  sequenceNumber: number
  title: string
  objective: string
  keyResult: string
  department: string
  status: string
  personInCharge: string | null
  startDate: string
  endDate: string
}

interface InitiativesListProps {
  initialData: Initiative[]
}

export function InitiativesList({ initialData }: InitiativesListProps) {
  const [initiatives, setInitiatives] = useState(initialData)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const filteredInitiatives = initiatives.filter((initiative) => {
    const matchesSearch =
      search === '' ||
      initiative.title.toLowerCase().includes(search.toLowerCase()) ||
      initiative.keyResult.toLowerCase().includes(search.toLowerCase())

    const matchesStatus =
      statusFilter === 'all' || initiative.status === statusFilter

    const matchesDepartment =
      departmentFilter === 'all' || initiative.department === departmentFilter

    return matchesSearch && matchesStatus && matchesDepartment
  })

  const handleCreateSuccess = async () => {
    setIsCreateOpen(false)
    // Refresh data
    const response = await fetch('/api/initiatives')
    const data = await response.json()
    setInitiatives(data)
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-3 sm:gap-4">
          <div className="relative flex-1 sm:max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search initiatives..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {DEPARTMENT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Initiative
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Initiative</DialogTitle>
            </DialogHeader>
            <InitiativeForm onSuccess={handleCreateSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <Card className="border border-gray-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Initiative</TableHead>
                <TableHead className="hidden md:table-cell w-24">Key Result</TableHead>
                <TableHead className="hidden md:table-cell w-28">Department</TableHead>
                <TableHead className="hidden md:table-cell w-28">Status</TableHead>
                <TableHead className="hidden md:table-cell w-24">Owner</TableHead>
                <TableHead className="hidden md:table-cell w-28">End Date</TableHead>
                <TableHead className="w-16">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInitiatives.map((initiative) => (
                <TableRow key={initiative.id} className="group hover:bg-gray-50">
                  <TableCell className="text-gray-500">
                    {initiative.sequenceNumber}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-md">
                      <p className="font-medium text-gray-900 truncate">
                        {initiative.title}
                      </p>
                      <Badge
                        variant="secondary"
                        className={cn(getStatusColor(initiative.status), "md:hidden mt-1")}
                      >
                        {formatStatus(initiative.status)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline">{initiative.keyResult}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm text-gray-600">
                      {formatDepartment(initiative.department)}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge
                      variant="secondary"
                      className={getStatusColor(initiative.status)}
                    >
                      {formatStatus(initiative.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm text-gray-600">
                      {formatTeamMember(initiative.personInCharge)}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm text-gray-500">
                      {formatDate(initiative.endDate)}
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
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/initiatives/${initiative.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}

              {filteredInitiatives.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <p className="text-gray-500">No initiatives found</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="text-sm text-gray-500">
        Showing {filteredInitiatives.length} of {initiatives.length} initiatives
      </div>
    </div>
  )
}
