'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Filter, User, MoreHorizontal, Eye, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CompanySelect } from '@/components/pipeline/company-select'
import { DepartmentSelect } from '@/components/pipeline/department-select'
import { ContactDetailModal } from './contact-detail-modal'

interface Contact {
  id: string
  name: string
  email: string | null
  phone: string | null
  role: string | null
  isPrimary: boolean
  company: { id: string; name: string }
  department: { id: string; name: string } | null
  _count: {
    deals: number
    potentials: number
    projects: number
  }
  createdAt: string | Date
}

interface Department {
  id: string
  name: string
}

interface ContactListProps {
  initialData: Contact[]
  companies: { id: string; name: string }[]
}

export function ContactList({ initialData, companies }: ContactListProps) {
  const [contacts, setContacts] = useState(initialData)
  const [search, setSearch] = useState('')
  const [companyFilter, setCompanyFilter] = useState<string>('all')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [filterDepartments, setFilterDepartments] = useState<Department[]>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Create form state
  const [newCompanyId, setNewCompanyId] = useState<string | null>(null)
  const [newDepartmentId, setNewDepartmentId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newRole, setNewRole] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [createDepartments, setCreateDepartments] = useState<Department[]>([])

  // Cascading filter: fetch departments when company filter changes
  const fetchDepartmentsForFilter = useCallback(async (companyId: string) => {
    try {
      const response = await fetch(`/api/companies/${companyId}/departments`)
      if (response.ok) {
        const data = await response.json()
        setFilterDepartments(data)
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error)
    }
  }, [])

  useEffect(() => {
    if (companyFilter !== 'all') {
      fetchDepartmentsForFilter(companyFilter)
    } else {
      setFilterDepartments([])
      setDepartmentFilter('all')
    }
  }, [companyFilter, fetchDepartmentsForFilter])

  // Fetch departments for create dialog when company changes
  const fetchDepartmentsForCreate = useCallback(async (companyId: string) => {
    try {
      const response = await fetch(`/api/companies/${companyId}/departments`)
      if (response.ok) {
        const data = await response.json()
        setCreateDepartments(data)
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error)
    }
  }, [])

  useEffect(() => {
    if (newCompanyId) {
      fetchDepartmentsForCreate(newCompanyId)
      setNewDepartmentId(null)
    } else {
      setCreateDepartments([])
      setNewDepartmentId(null)
    }
  }, [newCompanyId, fetchDepartmentsForCreate])

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      search === '' ||
      contact.name.toLowerCase().includes(search.toLowerCase()) ||
      (contact.email && contact.email.toLowerCase().includes(search.toLowerCase()))

    const matchesCompany =
      companyFilter === 'all' || contact.company.id === companyFilter

    const matchesDepartment =
      departmentFilter === 'all' || contact.department?.id === departmentFilter

    return matchesSearch && matchesCompany && matchesDepartment
  })

  const refreshContacts = async () => {
    const response = await fetch('/api/contacts')
    if (response.ok) {
      const data = await response.json()
      setContacts(data)
    }
  }

  const handleCreateContact = async () => {
    if (!newCompanyId || !newName.trim()) return

    setIsCreating(true)
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: newCompanyId,
          departmentId: newDepartmentId || null,
          name: newName.trim(),
          email: newEmail.trim() || null,
          phone: newPhone.trim() || null,
          role: newRole.trim() || null,
        }),
      })

      if (response.ok) {
        setIsCreateOpen(false)
        setNewCompanyId(null)
        setNewDepartmentId(null)
        setNewName('')
        setNewEmail('')
        setNewPhone('')
        setNewRole('')
        setCreateDepartments([])
        await refreshContacts()
      }
    } catch (error) {
      console.error('Error creating contact:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleRowClick = (contactId: string) => {
    setSelectedContactId(contactId)
    setIsDetailOpen(true)
  }

  const handleDetailClose = () => {
    setIsDetailOpen(false)
    setSelectedContactId(null)
  }

  const handleDeleted = async () => {
    handleDetailClose()
    await refreshContacts()
  }

  const handleUpdated = async () => {
    await refreshContacts()
  }

  const handleCompanyFilterChange = (value: string) => {
    setCompanyFilter(value)
    setDepartmentFilter('all')
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-3 sm:gap-4">
          <div className="relative flex-1 sm:max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={companyFilter} onValueChange={handleCompanyFilterChange}>
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

          <Select
            value={departmentFilter}
            onValueChange={setDepartmentFilter}
            disabled={companyFilter === 'all'}
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {filterDepartments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Contact</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Company *
                </Label>
                <CompanySelect
                  value={newCompanyId}
                  onValueChange={setNewCompanyId}
                />
              </div>

              {createDepartments.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Department
                  </Label>
                  <DepartmentSelect
                    value={newDepartmentId}
                    onValueChange={setNewDepartmentId}
                    departments={createDepartments}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Name *
                  </Label>
                  <Input
                    placeholder="Contact name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Role
                  </Label>
                  <Input
                    placeholder="e.g., CEO, Manager"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Email
                  </Label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Phone
                  </Label>
                  <Input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                onClick={handleCreateContact}
                disabled={!newCompanyId || !newName.trim() || isCreating}
              >
                {isCreating ? 'Creating...' : 'Create Contact'}
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
                <TableHead className="hidden lg:table-cell w-36">Department</TableHead>
                <TableHead className="hidden md:table-cell w-48">Email</TableHead>
                <TableHead className="hidden lg:table-cell w-32">Role</TableHead>
                <TableHead className="w-16">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.map((contact) => (
                <TableRow
                  key={contact.id}
                  className="group cursor-pointer hover:bg-gray-50"
                  onClick={() => handleRowClick(contact.id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">
                            {contact.name}
                          </p>
                          {contact.isPrimary && (
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          )}
                        </div>
                        {contact.role && (
                          <p className="text-sm text-gray-500 md:hidden">
                            {contact.role}
                          </p>
                        )}
                        <p className="text-sm text-gray-500 md:hidden">
                          {contact.company.name}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm text-gray-600">
                      {contact.company.name}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-sm text-gray-600">
                      {contact.department?.name || '-'}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm text-gray-600">
                      {contact.email || '-'}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-sm text-gray-600">
                      {contact.role || '-'}
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
                        <DropdownMenuItem onClick={() => handleRowClick(contact.id)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}

              {filteredContacts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                        <User className="h-6 w-6 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-gray-900 font-medium">
                          No contacts yet
                        </p>
                        <p className="text-gray-500 text-sm">
                          Add your first contact to get started.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsCreateOpen(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Contact
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
      {filteredContacts.length > 0 && (
        <div className="text-sm text-gray-500">
          <span className="hidden sm:inline">Showing </span>
          {filteredContacts.length} of {contacts.length}
          <span className="hidden sm:inline"> contacts</span>
        </div>
      )}

      {/* Detail Modal */}
      <ContactDetailModal
        contactId={selectedContactId}
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
