'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { FileText, ImageIcon, Download, Trash2, Eye, Sparkles, Package } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { formatFileSize, getCategoryColor, getAIStatusColor, formatAIStatus, isPreviewable, DOCUMENT_CATEGORIES, type DocumentCategory, type DocumentAIStatus } from '@/lib/document-utils'

interface Document {
  id: string
  filename: string
  storagePath: string
  mimeType: string
  size: number
  category: DocumentCategory
  createdAt: string
  aiStatus?: DocumentAIStatus
  aiAnalyzedAt?: string | null
}

interface DocumentCardProps {
  document: Document
  projectId: string
  onPreview: (document: Document) => void
  onCategoryChange: () => void
  onDelete: () => void
  onReview?: (document: Document) => void
  onReviewDeliverable?: (document: Document) => void
}

export function DocumentCard({
  document,
  projectId,
  onPreview,
  onCategoryChange,
  onDelete,
  onReview,
  onReviewDeliverable,
}: DocumentCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const isImage = isPreviewable(document.mimeType)
  const Icon = isImage ? ImageIcon : FileText

  // Extract UUID filename from storagePath for file serving
  const storageFilename = document.storagePath.split('/').pop() || ''

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(
        `/api/projects/${projectId}/documents/${document.id}`,
        { method: 'DELETE' }
      )
      if (response.ok) {
        onDelete()
      }
    } catch (error) {
      console.error('Failed to delete document:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCategoryChange = async (category: DocumentCategory) => {
    setIsUpdating(true)
    try {
      const response = await fetch(
        `/api/projects/${projectId}/documents/${document.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category }),
        }
      )
      if (response.ok) {
        onCategoryChange()
      }
    } catch (error) {
      console.error('Failed to update category:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDownload = () => {
    // Use the file serving API route with storage filename
    window.open(`/api/files/${projectId}/${storageFilename}`, '_blank')
  }

  const handlePreview = () => {
    if (isImage) {
      onPreview(document)
    } else {
      // PDF opens in new tab
      window.open(`/api/files/${projectId}/${storageFilename}`, '_blank')
    }
  }

  return (
    <div className="p-3 border rounded-lg bg-white hover:bg-gray-50 space-y-2">
      {/* Top row: file info */}
      <div className="flex items-center gap-3">
        <Icon className="h-8 w-8 text-gray-400 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium truncate">{document.filename}</span>
            <Badge variant="outline" className={getCategoryColor(document.category)}>
              {document.category}
            </Badge>
            {document.aiStatus && (
              <Badge variant="outline" className={getAIStatusColor(document.aiStatus)}>
                {formatAIStatus(document.aiStatus)}
              </Badge>
            )}
          </div>
          <div className="text-sm text-gray-500 mt-0.5">
            {formatFileSize(document.size)} - {formatDate(document.createdAt)}
          </div>
        </div>
      </div>

      {/* Bottom row: actions - wraps on mobile */}
      <div className="flex items-center gap-1 flex-wrap">
        {/* Category select */}
        <Select
          value={document.category}
          onValueChange={handleCategoryChange}
          disabled={isUpdating}
        >
          <SelectTrigger className="w-[90px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DOCUMENT_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Review - only for ANALYZED invoices/receipts */}
        {onReview && document.aiStatus === 'ANALYZED' && (document.category === 'INVOICE' || document.category === 'RECEIPT') && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            onClick={() => onReview(document)}
            title="Review AI extraction"
          >
            <Sparkles className="h-4 w-4" />
          </Button>
        )}

        {/* Import Deliverables - only for ANALYZED invoices (from Talenta/Motionvii) */}
        {onReviewDeliverable && document.aiStatus === 'ANALYZED' && document.category === 'INVOICE' && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
            onClick={() => onReviewDeliverable(document)}
            title="Import Deliverables"
          >
            <Package className="h-4 w-4" />
          </Button>
        )}

        {/* Preview */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handlePreview}
          title={isImage ? 'Preview' : 'Open PDF'}
        >
          <Eye className="h-4 w-4" />
        </Button>

        {/* Download */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleDownload}
          title="Download"
        >
          <Download className="h-4 w-4" />
        </Button>

        {/* Delete with confirmation */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Document</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{document.filename}&quot;? This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
