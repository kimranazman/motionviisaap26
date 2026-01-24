'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { Plus, Search, Truck, MoreHorizontal, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPaymentTerms, getPaymentTermsColor } from '@/lib/supplier-utils'
import { PaymentTermsSelect } from './payment-terms-select'
import { SupplierDetailModal } from './supplier-detail-modal'

interface Supplier {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  website: string | null
  contactPerson: string | null
  acceptsCredit: boolean
  paymentTerms: string | null
  notes: string | null
  createdAt: string | Date
  _count: {
    costs: number
  }
}

interface SupplierListProps {
  initialData: Supplier[]
}

export function SupplierList({ initialData }: SupplierListProps) {
  const [suppliers, setSuppliers] = useState(initialData)
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Form state for creating new supplier
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newContactPerson, setNewContactPerson] = useState('')
  const [newAcceptsCredit, setNewAcceptsCredit] = useState(false)
  const [newPaymentTerms, setNewPaymentTerms] = useState<string | null>(null)
  const [newNotes, setNewNotes] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const filteredSuppliers = suppliers.filter((supplier) => {
    return (
      search === '' ||
      supplier.name.toLowerCase().includes(search.toLowerCase())
    )
  })

  const refreshSuppliers = async () => {
    const response = await fetch('/api/suppliers')
    if (response.ok) {
      const data = await response.json()
      setSuppliers(data)
    }
  }

  const resetForm = () => {
    setNewName('')
    setNewEmail('')
    setNewPhone('')
    setNewContactPerson('')
    setNewAcceptsCredit(false)
    setNewPaymentTerms(null)
    setNewNotes('')
  }

  const handleCreateSupplier = async () => {
    if (!newName.trim()) return

    setIsCreating(true)
    try {
      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim() || null,
          phone: newPhone.trim() || null,
          contactPerson: newContactPerson.trim() || null,
          acceptsCredit: newAcceptsCredit,
          paymentTerms: newPaymentTerms,
          notes: newNotes.trim() || null,
        }),
      })

      if (response.ok) {
        setIsCreateOpen(false)
        resetForm()
        await refreshSuppliers()
      }
    } catch (error) {
      console.error('Error creating supplier:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleRowClick = (supplierId: string) => {
    setSelectedSupplierId(supplierId)
    setIsDetailOpen(true)
  }

  const handleDetailClose = () => {
    setIsDetailOpen(false)
    setSelectedSupplierId(null)
  }

  const handleSupplierDeleted = async () => {
    handleDetailClose()
    await refreshSuppliers()
  }

  const handleSupplierUpdated = async () => {
    await refreshSuppliers()
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
        <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-3 sm:gap-4">
          <div className="relative flex-1 sm:max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search suppliers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Supplier</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Supplier Name *
                </label>
                <Input
                  placeholder="Enter supplier name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <Input
                    placeholder="+60 12-345 6789"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Contact Person
                </label>
                <Input
                  placeholder="Contact person name"
                  value={newContactPerson}
                  onChange={(e) => setNewContactPerson(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="accepts-credit">Accepts Credit</Label>
                  <p className="text-xs text-gray-500">
                    Supplier allows deferred payment
                  </p>
                </div>
                <Switch
                  id="accepts-credit"
                  checked={newAcceptsCredit}
                  onCheckedChange={setNewAcceptsCredit}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Payment Terms
                </label>
                <PaymentTermsSelect
                  value={newPaymentTerms}
                  onValueChange={setNewPaymentTerms}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Notes
                </label>
                <Textarea
                  placeholder="Add any notes about this supplier"
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
                onClick={handleCreateSupplier}
                disabled={!newName.trim() || isCreating}
              >
                {isCreating ? 'Creating...' : 'Create Supplier'}
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
                <TableHead className="hidden md:table-cell w-48">Email</TableHead>
                <TableHead className="hidden md:table-cell w-24 text-center">Costs</TableHead>
                <TableHead className="hidden md:table-cell w-32">Payment Terms</TableHead>
                <TableHead className="hidden md:table-cell w-32">Added</TableHead>
                <TableHead className="w-16">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map((supplier) => (
                <TableRow
                  key={supplier.id}
                  className="group cursor-pointer hover:bg-gray-50"
                  onClick={() => handleRowClick(supplier.id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
                        <Truck className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {supplier.name}
                        </p>
                        {supplier.contactPerson && (
                          <p className="text-sm text-gray-500">
                            {supplier.contactPerson}
                          </p>
                        )}
                        {supplier.email && (
                          <p className="text-sm text-gray-500 md:hidden truncate">
                            {supplier.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm text-gray-600">
                      {supplier.email || '-'}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-center">
                    <span className="text-sm text-gray-600">
                      {supplier._count.costs}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {supplier.paymentTerms ? (
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs font-medium',
                          getPaymentTermsColor(supplier.paymentTerms)
                        )}
                      >
                        {formatPaymentTerms(supplier.paymentTerms)}
                      </Badge>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm text-gray-500">
                      {formatDate(supplier.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            'h-8 w-8',
                            'md:opacity-0 md:group-hover:opacity-100',
                            'focus:opacity-100 transition-opacity'
                          )}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleRowClick(supplier.id)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}

              {filteredSuppliers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                        <Truck className="h-6 w-6 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-gray-900 font-medium">
                          No suppliers yet
                        </p>
                        <p className="text-gray-500 text-sm">
                          Add your first supplier to get started.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsCreateOpen(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Supplier
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
      {filteredSuppliers.length > 0 && (
        <div className="text-sm text-gray-500">
          <span className="hidden sm:inline">Showing </span>
          {filteredSuppliers.length} of {suppliers.length}
          <span className="hidden sm:inline"> suppliers</span>
        </div>
      )}

      {/* Detail Modal */}
      <SupplierDetailModal
        supplierId={selectedSupplierId}
        open={isDetailOpen}
        onOpenChange={(open) => {
          if (!open) handleDetailClose()
        }}
        onDeleted={handleSupplierDeleted}
        onUpdated={handleSupplierUpdated}
      />
    </div>
  )
}
