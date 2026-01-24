'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Trash2, Package } from 'lucide-react'
import { SupplierInlineField } from './supplier-inline-field'
import { PaymentTermsSelect } from './payment-terms-select'
import {
  formatPaymentTerms,
  getPaymentTermsColor,
  getCreditStatusBadge,
} from '@/lib/supplier-utils'
import { cn } from '@/lib/utils'

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
  _count: {
    costs: number
  }
}

interface SupplierDetailModalProps {
  supplierId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
  onUpdated: () => void
}

export function SupplierDetailModal({
  supplierId,
  open,
  onOpenChange,
  onDeleted,
  onUpdated,
}: SupplierDetailModalProps) {
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const fetchSupplier = useCallback(async () => {
    if (!supplierId) return

    setIsLoading(true)
    setSupplier(null)

    try {
      const response = await fetch(`/api/suppliers/${supplierId}`)
      const data = await response.json()
      setSupplier(data)
    } catch (error) {
      console.error('Failed to fetch supplier:', error)
    } finally {
      setIsLoading(false)
    }
  }, [supplierId])

  useEffect(() => {
    if (supplierId && open) {
      fetchSupplier()
    }
  }, [supplierId, open, fetchSupplier])

  const handleFieldSave = async (field: string, value: string | boolean | null) => {
    if (!supplier) return

    const response = await fetch(`/api/suppliers/${supplier.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    })

    if (response.ok) {
      const updated = await response.json()
      setSupplier((prev) => (prev ? { ...prev, ...updated } : null))
      onUpdated()
    } else {
      throw new Error('Failed to update')
    }
  }

  const handleDelete = async () => {
    if (!supplier) return

    setIsDeleting(true)
    setDeleteError(null)

    try {
      const response = await fetch(`/api/suppliers/${supplier.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onDeleted()
      } else {
        const data = await response.json()
        setDeleteError(data.error || 'Failed to delete supplier')
      }
    } catch {
      setDeleteError('Failed to delete supplier')
    } finally {
      setIsDeleting(false)
    }
  }

  const creditBadge = supplier ? getCreditStatusBadge(supplier.acceptsCredit) : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        {isLoading ? (
          <SupplierDetailSkeleton />
        ) : supplier ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">
                <SupplierInlineField
                  value={supplier.name}
                  onSave={(value) => handleFieldSave('name', value)}
                  placeholder="Supplier name"
                  className="text-xl font-semibold"
                />
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Contact Info */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">
                    Email
                  </label>
                  <SupplierInlineField
                    value={supplier.email || ''}
                    onSave={(value) => handleFieldSave('email', value)}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">
                    Phone
                  </label>
                  <SupplierInlineField
                    value={supplier.phone || ''}
                    onSave={(value) => handleFieldSave('phone', value)}
                    placeholder="+60 12-345 6789"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">
                    Address
                  </label>
                  <SupplierInlineField
                    value={supplier.address || ''}
                    onSave={(value) => handleFieldSave('address', value)}
                    placeholder="123 Main St, City, Country"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">
                    Website
                  </label>
                  <SupplierInlineField
                    value={supplier.website || ''}
                    onSave={(value) => handleFieldSave('website', value)}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">
                    Contact Person
                  </label>
                  <SupplierInlineField
                    value={supplier.contactPerson || ''}
                    onSave={(value) => handleFieldSave('contactPerson', value)}
                    placeholder="Contact person name"
                  />
                </div>
              </div>

              <Separator />

              {/* Credit Terms Section */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Credit Terms</h3>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="accepts-credit-edit">Accepts Credit</Label>
                    <p className="text-xs text-gray-500">
                      Supplier allows deferred payment
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {creditBadge && (
                      <Badge
                        variant="outline"
                        className={cn('text-xs', creditBadge.color)}
                      >
                        {creditBadge.label}
                      </Badge>
                    )}
                    <Switch
                      id="accepts-credit-edit"
                      checked={supplier.acceptsCredit}
                      onCheckedChange={(checked) =>
                        handleFieldSave('acceptsCredit', checked)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Payment Terms
                    </label>
                    {supplier.paymentTerms && (
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          getPaymentTermsColor(supplier.paymentTerms)
                        )}
                      >
                        {formatPaymentTerms(supplier.paymentTerms)}
                      </Badge>
                    )}
                  </div>
                  <PaymentTermsSelect
                    value={supplier.paymentTerms}
                    onValueChange={(value) =>
                      handleFieldSave('paymentTerms', value)
                    }
                  />
                </div>
              </div>

              <Separator />

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500">
                  Notes
                </label>
                <SupplierInlineField
                  value={supplier.notes || ''}
                  onSave={(value) => handleFieldSave('notes', value)}
                  placeholder="Add notes about this supplier..."
                  multiline
                />
              </div>

              <Separator />

              {/* Summary Card */}
              <Card className="p-4 bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border">
                    <Package className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {supplier._count.costs} cost
                      {supplier._count.costs !== 1 ? 's' : ''} linked
                    </p>
                    <p className="text-xs text-gray-500">
                      View price list and projects in next update
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            <DialogFooter className="flex-row justify-between sm:justify-between">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete &quot;{supplier.name}&quot;?
                      This action cannot be undone.
                      {deleteError && (
                        <span className="block mt-2 text-red-600">
                          {deleteError}
                        </span>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete Supplier'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto"
              >
                Close
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="py-8 text-center text-gray-500">
            Supplier not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function SupplierDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Supplier name */}
      <Skeleton className="h-8 w-64" />

      {/* Contact fields */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-18" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>

      <Separator />

      {/* Credit terms */}
      <Skeleton className="h-5 w-24" />
      <div className="space-y-2">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>

      <Separator />

      {/* Notes */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  )
}
