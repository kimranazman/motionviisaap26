'use client'

import { useState, useEffect } from 'react'
import { DetailView } from '@/components/ui/detail-view'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Trash2, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { formatDate } from '@/lib/utils'

interface Deliverable {
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

interface DeliverableDetailSheetProps {
  deliverable: Deliverable | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: () => void
}

export function DeliverableDetailSheet({
  deliverable,
  open,
  onOpenChange,
  onUpdate,
}: DeliverableDetailSheetProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [value, setValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize form when deliverable changes
  useEffect(() => {
    if (deliverable && open) {
      setTitle(deliverable.title)
      setDescription(deliverable.description || '')
      setValue(deliverable.value?.toString() || '')
      setError(null)
    }
  }, [deliverable, open])

  const handleSave = async () => {
    if (!deliverable) return
    setError(null)
    setIsSaving(true)

    try {
      const res = await fetch(
        `/api/projects/${deliverable.project.id}/deliverables/${deliverable.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || null,
            value: value ? parseFloat(value) : null,
          }),
        }
      )

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }

      onUpdate()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deliverable) return
    setIsDeleting(true)

    try {
      const res = await fetch(
        `/api/projects/${deliverable.project.id}/deliverables/${deliverable.id}`,
        { method: 'DELETE' }
      )

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete')
      }

      onUpdate()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (!deliverable) return null

  return (
    <>
      <DetailView
        open={open}
        onOpenChange={onOpenChange}
        title="Deliverable Details"
        expandHref={`/projects/${deliverable.project.id}`}
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-6 p-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Service Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter service title"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
              rows={3}
            />
          </div>

          {/* Value */}
          <div className="space-y-2">
            <Label htmlFor="value">Value (RM)</Label>
            <Input
              id="value"
              type="number"
              step="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0.00"
            />
          </div>

          {/* Read-only info */}
          <div className="pt-4 border-t space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Project</Label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm">{deliverable.project.title}</span>
                <Link
                  href={`/projects/${deliverable.project.id}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {deliverable.project.company && (
              <div>
                <Label className="text-xs text-muted-foreground">Client</Label>
                <p className="text-sm mt-1">
                  {deliverable.project.company.name}
                </p>
              </div>
            )}

            <div>
              <Label className="text-xs text-muted-foreground">Created</Label>
              <p className="text-sm mt-1">
                {formatDate(new Date(deliverable.createdAt))}
              </p>
            </div>

            {deliverable.aiExtracted && (
              <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded w-fit">
                AI Extracted
              </div>
            )}
          </div>
        </div>
      </DetailView>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deliverable</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deliverable.title}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
