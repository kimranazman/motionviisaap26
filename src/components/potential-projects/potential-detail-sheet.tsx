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
import { Loader2, Trash2 } from 'lucide-react'
import { CompanySelect } from '@/components/pipeline/company-select'
import { ContactSelect } from '@/components/pipeline/contact-select'
import { getPotentialStageColor, formatPotentialStage } from '@/lib/potential-utils'
import { cn } from '@/lib/utils'

interface Contact {
  id: string
  name: string
}

interface PotentialProject {
  id: string
  title: string
  description: string | null
  estimatedValue: number | null
  stage: string
  position: number
  company: { id: string; name: string } | null
  contact: { id: string; name: string } | null
}

interface PotentialDetailSheetProps {
  project: PotentialProject | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (project: PotentialProject) => void
  onDelete: (projectId: string) => void
}

export function PotentialDetailSheet({
  project,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
}: PotentialDetailSheetProps) {
  const [title, setTitle] = useState('')
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [contactId, setContactId] = useState<string | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [estimatedValue, setEstimatedValue] = useState('')
  const [description, setDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoadingContacts, setIsLoadingContacts] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize form when project changes
  useEffect(() => {
    if (project && open) {
      setTitle(project.title)
      setCompanyId(project.company?.id || null)
      setContactId(project.contact?.id || null)
      setEstimatedValue(project.estimatedValue?.toString() || '')
      setDescription(project.description || '')
      setError(null)

      // Fetch contacts for selected company
      if (project.company?.id) {
        fetchContacts(project.company.id)
      }
    }
  }, [project, open])

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
    if (!project) return
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
      const response = await fetch(`/api/potential-projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          companyId,
          contactId: contactId || null,
          estimatedValue: estimatedValue ? parseFloat(estimatedValue) : null,
          description: description.trim() || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to update project')
        return
      }

      const updatedProject = await response.json()
      onUpdate(updatedProject)
      onOpenChange(false)
    } catch (err) {
      console.error('Failed to update project:', err)
      setError('Failed to update project')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!project) return

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/potential-projects/${project.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to delete project')
        return
      }

      onDelete(project.id)
      onOpenChange(false)
    } catch (err) {
      console.error('Failed to delete project:', err)
      setError('Failed to delete project')
    } finally {
      setIsDeleting(false)
    }
  }

  if (!project) return null

  const hasChanges =
    title !== project.title ||
    companyId !== (project.company?.id || null) ||
    contactId !== (project.contact?.id || null) ||
    estimatedValue !== (project.estimatedValue?.toString() || '') ||
    description !== (project.description || '')

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <Badge className={cn('shrink-0', getPotentialStageColor(project.stage))}>
              {formatPotentialStage(project.stage)}
            </Badge>
            <SheetTitle className="text-left text-lg leading-snug truncate">
              {project.title}
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
                placeholder="Enter project title"
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

            {/* Estimated Value */}
            <div className="space-y-2">
              <Label htmlFor="edit-estimatedValue">Estimated Value</Label>
              <Input
                id="edit-estimatedValue"
                type="number"
                step="0.01"
                min="0"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
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
                placeholder="Add notes about this project..."
                className="min-h-[80px]"
              />
            </div>

            {/* Error message */}
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>
        </ScrollArea>

        <SheetFooter className="p-4 border-t flex-col sm:flex-row gap-2 sm:gap-0 justify-between sm:justify-between">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full sm:w-auto"
                disabled={isDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Project</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete &quot;{project.title}&quot;? This
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
                  {isDeleting ? 'Deleting...' : 'Delete Project'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="w-full sm:w-auto"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
