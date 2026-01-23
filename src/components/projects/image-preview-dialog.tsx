'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Document {
  id: string
  filename: string
  storagePath: string
  mimeType: string
}

interface ImagePreviewDialogProps {
  document: Document | null
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImagePreviewDialog({
  document,
  projectId,
  open,
  onOpenChange,
}: ImagePreviewDialogProps) {
  if (!document) return null

  // Extract UUID filename from storagePath for file serving
  const storageFilename = document.storagePath.split('/').pop() || ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="truncate pr-8">{document.filename}</DialogTitle>
        </DialogHeader>
        <div className="p-4 flex items-center justify-center bg-gray-100 min-h-[300px] max-h-[70vh] overflow-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/files/${projectId}/${storageFilename}`}
            alt={document.filename}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
