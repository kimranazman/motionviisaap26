'use client'

import { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Loader2, Trash2 } from 'lucide-react'
import { CompanySelect } from './company-select'
import { ContactSelect } from './contact-select'
import { getStageColor, formatDealStage } from '@/lib/pipeline-utils'
import { cn } from '@/lib/utils'

interface Contact {
  id: string
  name: string
}

interface Deal {
  id: string
  title: string
  description: string | null
  value: number | null
  stage: string
  lostReason?: string | null
  position: number
  company: { id: string; name: string } | null
  contact: { id: string; name: string } | null
}

interface DealDetailSheetProps {
  deal: Deal | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (deal: Deal) => void
  onDelete: (dealId: string) => void
}

export function DealDetailSheet({
  deal,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
}: DealDetailSheetProps) {
  const [title, setTitle] = useState('')
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [contactId, setContactId] = useState<string | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [value, setValue] = useState('')
  const [description, setDescription] = useState('')
  const [lostReason, setLostReason] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoadingContacts, setIsLoadingContacts] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize form when deal changes
  useEffect(() => {
    if (deal && open) {
      setTitle(deal.title)
      setCompanyId(deal.company?.id || null)
      setContactId(deal.contact?.id || null)
      setValue(deal.value?.toString() || '')
      setDescription(deal.description || '')
      setLostReason(deal.lostReason || '')
      setError(null)

      // Fetch contacts for selected company
      if (deal.company?.id) {
        fetchContacts(deal.company.id)
      }
    }
  }, [deal, open])

  const fetchContacts = async (compId: string) => {
    setIsLoadingContacts(true)
    try {
      const response = await fetch(`/api/companies/${compId}`)
      if (response.ok) {
        const data = await response.json()
        setContacts(data.contacts || [])
      }
    } catch (error) {
      console.error('Failed to fetch contacts:', error)
      setContacts([])
    } finally {
      setIsLoadingContacts(false)
    }
  }

  // Handle company change
  const handleCompanyChange = (newCompanyId: string | null) => {
    setCompanyId(newCompanyId)
    setContactId(null) // Clear contact when company changes
    if (newCompanyId) {
      fetchContacts(newCompanyId)
    } else {
      setContacts([])
    }
  }

  const handleSave = async () => {
    if (!deal) return
    setError(null)

    // Validate required fields
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    if (!companyId) {
      setError('Company is required')
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch(`/api/deals/${deal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          companyId,
          contactId: contactId || null,
          value: value ? parseFloat(value) : null,
          description: description.trim() || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to update deal')
        return
      }

      const updatedDeal = await response.json()
      onUpdate(updatedDeal)
      onOpenChange(false)
    } catch (err) {
      console.error('Failed to update deal:', err)
      setError('Failed to update deal')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deal) return

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/deals/${deal.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to delete deal')
        return
      }

      onDelete(deal.id)
      onOpenChange(false)
    } catch (err) {
      console.error('Failed to delete deal:', err)
      setError('Failed to delete deal')
    } finally {
      setIsDeleting(false)
    }
  }

  if (!deal) return null

  const hasChanges =
    title !== deal.title ||
    companyId !== (deal.company?.id || null) ||
    contactId !== (deal.contact?.id || null) ||
    value !== (deal.value?.toString() || '') ||
    description !== (deal.description || '')

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <Badge className={cn('shrink-0', getStageColor(deal.stage))}>
              {formatDealStage(deal.stage)}
            </Badge>
            <SheetTitle className="text-left text-lg leading-snug truncate">
              {deal.title}
            </SheetTitle>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="edit-title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter deal title"
              />
            </div>

            {/* Company */}
            <div className="space-y-2">
              <Label>
                Company <span className="text-red-500">*</span>
              </Label>
              <CompanySelect
                value={companyId}
                onValueChange={handleCompanyChange}
              />
            </div>

            {/* Contact */}
            <div className="space-y-2">
              <Label>Contact</Label>
              <ContactSelect
                value={contactId}
                onValueChange={setContactId}
                contacts={contacts}
                disabled={!companyId || isLoadingContacts}
              />
              {isLoadingContacts && (
                <p className="text-xs text-muted-foreground">
                  Loading contacts...
                </p>
              )}
            </div>

            {/* Value */}
            <div className="space-y-2">
              <Label htmlFor="edit-value">Value</Label>
              <Input
                id="edit-value"
                type="number"
                step="0.01"
                min="0"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0.00"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add notes about this deal..."
                className="min-h-[80px]"
              />
            </div>

            {/* Lost Reason (only show if stage is LOST) */}
            {deal.stage === 'LOST' && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="lost-reason" className="text-red-600">
                    Lost Reason
                  </Label>
                  <Textarea
                    id="lost-reason"
                    value={lostReason}
                    disabled
                    className="min-h-[60px] bg-red-50"
                    placeholder="No reason provided"
                  />
                </div>
              </>
            )}

            {/* Error message */}
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>
        </ScrollArea>

        <SheetFooter className="p-4 border-t flex-row justify-between sm:justify-between">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                disabled={isDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Deal</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete &quot;{deal.title}&quot;? This
                  action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Deal'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
