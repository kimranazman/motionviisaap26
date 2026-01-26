'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
import { CurrencyInput } from '@/components/ui/currency-input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Loader2, Trash2, Archive, ArchiveRestore, ExternalLink, Lock } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { ActivityTimeline } from '@/components/shared/activity-timeline'
import { CompanySelect } from './company-select'
import { ContactSelect } from './contact-select'
import { getStageColor, formatDealStage } from '@/lib/pipeline-utils'
import { cn, formatCurrency } from '@/lib/utils'

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
  isArchived?: boolean
  company: { id: string; name: string } | null
  contact: { id: string; name: string } | null
  project?: {
    id: string
    title: string
    revenue: number | null
    potentialRevenue: number | null
  } | null
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
  const [isArchiving, setIsArchiving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activityLogs, setActivityLogs] = useState<{
    id: string
    action: string
    field?: string | null
    oldValue?: string | null
    newValue?: string | null
    createdAt: string
    user?: { name?: string | null; image?: string | null } | null
  }[]>([])
  const [isLoadingActivity, setIsLoadingActivity] = useState(false)

  const fetchActivityLogs = async (dealId: string) => {
    setIsLoadingActivity(true)
    try {
      const response = await fetch(`/api/activity-logs?entityType=DEAL&entityId=${dealId}`)
      if (response.ok) {
        const data = await response.json()
        setActivityLogs(data)
      }
    } catch (error) {
      console.error('Failed to fetch activity logs:', error)
    } finally {
      setIsLoadingActivity(false)
    }
  }

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
      setActivityLogs([])

      // Fetch contacts for selected company
      if (deal.company?.id) {
        fetchContacts(deal.company.id)
      }

      // Fetch activity logs for converted deals
      if (deal.project) {
        fetchActivityLogs(deal.id)
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

  const handleArchive = async () => {
    if (!deal) return
    setIsArchiving(true)
    try {
      const response = await fetch(`/api/deals/${deal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: !deal.isArchived }),
      })
      if (response.ok) {
        const updated = await response.json()
        onUpdate(updated)
        toast.success(updated.isArchived ? 'Deal archived' : 'Deal unarchived')
      } else {
        toast.error('Failed to update archive status')
      }
    } catch (err) {
      console.error('Failed to archive deal:', err)
      toast.error('Failed to update archive status')
    } finally {
      setIsArchiving(false)
    }
  }

  if (!deal) return null

  // Computed flags for conversion and read-only state
  const isConverted = deal.stage === 'WON' && deal.project !== null && deal.project !== undefined
  const isLost = deal.stage === 'LOST'
  const isReadOnly = isConverted || isLost

  const hasChanges =
    title !== deal.title ||
    companyId !== (deal.company?.id || null) ||
    contactId !== (deal.contact?.id || null) ||
    value !== (deal.value?.toString() || '') ||
    description !== (deal.description || '')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="md:max-w-[650px] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b shrink-0 pr-12">
          <div className="flex items-center gap-3">
            <Badge className={cn('shrink-0', getStageColor(deal.stage))}>
              {formatDealStage(deal.stage)}
            </Badge>
            <DialogTitle className="text-left text-lg leading-snug truncate">
              {deal.title}
            </DialogTitle>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0">
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
                disabled={isReadOnly}
                className={cn(isReadOnly && "bg-gray-50 cursor-not-allowed")}
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
                disabled={isReadOnly}
              />
            </div>

            {/* Contact */}
            <div className="space-y-2">
              <Label>Contact</Label>
              <ContactSelect
                value={contactId}
                onValueChange={setContactId}
                contacts={contacts}
                disabled={!companyId || isLoadingContacts || isReadOnly}
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
              <CurrencyInput
                id="edit-value"
                value={value}
                onChange={setValue}
                placeholder="0"
                disabled={isReadOnly}
                className={cn(isReadOnly && "bg-gray-50 cursor-not-allowed")}
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
                className={cn("min-h-[80px]", isReadOnly && "bg-gray-50 cursor-not-allowed")}
                disabled={isReadOnly}
              />
            </div>

            {/* Converted Project Info */}
            {isConverted && deal.project && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Lock className="h-4 w-4" />
                    <span className="text-sm">Converted to Project</span>
                  </div>

                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-green-800">{deal.project.title}</div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/projects?open=${deal.project.id}`}>
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </Button>
                    </div>

                    {/* Variance display */}
                    {deal.project.revenue !== null && (
                      <div className="mt-3 pt-3 border-t border-green-200 text-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-gray-500">Estimated: </span>
                            <span className="font-medium">{formatCurrency(deal.value ?? 0)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Actual: </span>
                            <span className="font-medium">{formatCurrency(deal.project.revenue)}</span>
                          </div>
                        </div>
                        <div className={cn(
                          "mt-1 font-medium",
                          deal.project.revenue > (deal.value ?? 0) ? "text-green-600" : "text-amber-600"
                        )}>
                          Variance: {deal.project.revenue > (deal.value ?? 0) ? '+' : ''}
                          {formatCurrency(deal.project.revenue - (deal.value ?? 0))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Activity History - Only for converted deals */}
            {isConverted && (
              <>
                <Separator />
                <div className="space-y-3">
                  <Label className="text-muted-foreground">Activity History</Label>
                  <ActivityTimeline
                    logs={activityLogs}
                    isLoading={isLoadingActivity}
                  />
                </div>
              </>
            )}

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

        <DialogFooter className="p-4 border-t shrink-0 flex-row gap-2 justify-between sm:justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleArchive}
              disabled={isArchiving}
              className={deal.isArchived ? 'text-blue-600' : 'text-gray-600'}
            >
              {deal.isArchived ? (
                <>
                  <ArchiveRestore className="mr-2 h-4 w-4" />
                  Unarchive
                </>
              ) : (
                <>
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </>
              )}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
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
          </div>

          {isReadOnly ? (
            <div className="text-sm text-muted-foreground text-center py-2 px-4">
              {isConverted ? 'Converted deals cannot be edited' : 'Lost deals cannot be edited'}
            </div>
          ) : (
            <Button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="w-full sm:w-auto"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
