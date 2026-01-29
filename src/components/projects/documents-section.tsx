'use client'

import { useCallback, useState } from 'react'
import { useDropzone, FileRejection } from 'react-dropzone'
import { Upload, AlertCircle, CheckCircle, X, FileText, Plus } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { MAX_FILE_SIZE, DOCUMENT_CATEGORIES, type DocumentCategory, type DocumentAIStatus } from '@/lib/document-utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DocumentList } from './document-list'

interface FileWithProgress {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'complete' | 'error'
  error?: string
}

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

interface DocumentsSectionProps {
  projectId: string
  documents: Document[]
  onPreview: (doc: Document) => void
  onDocumentsChange: () => void
  onReview?: (doc: Document) => void
  onReviewDeliverable?: (doc: Document) => void
  onReanalyze?: (doc: Document) => void
}

export function DocumentsSection({
  projectId,
  documents,
  onPreview,
  onDocumentsChange,
  onReview,
  onReviewDeliverable,
  onReanalyze,
}: DocumentsSectionProps) {
  const [files, setFiles] = useState<FileWithProgress[]>([])
  const [defaultCategory, setDefaultCategory] = useState<DocumentCategory>('OTHER')

  const uploadFile = useCallback(async (file: File, index: number, category: DocumentCategory) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', category)

    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          setFiles(prev => prev.map((f, i) =>
            i === index ? { ...f, progress, status: 'uploading' } : f
          ))
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setFiles(prev => prev.map((f, i) =>
            i === index ? { ...f, progress: 100, status: 'complete' } : f
          ))
          resolve()
        } else {
          let errorMsg = 'Upload failed'
          try {
            const response = JSON.parse(xhr.responseText)
            errorMsg = response.error || errorMsg
          } catch {
            // Keep default error message
          }
          setFiles(prev => prev.map((f, i) =>
            i === index ? { ...f, status: 'error', error: errorMsg } : f
          ))
          reject(new Error(errorMsg))
        }
      }

      xhr.onerror = () => {
        setFiles(prev => prev.map((f, i) =>
          i === index ? { ...f, status: 'error', error: 'Network error' } : f
        ))
        reject(new Error('Network error'))
      }

      xhr.open('POST', `/api/projects/${projectId}/documents`)
      xhr.send(formData)
    })
  }, [projectId])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    // Add files to state with pending status
    const newFiles = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending' as const,
    }))

    const startIndex = files.length
    const categoryToUse = defaultCategory
    setFiles(prev => [...prev, ...newFiles])

    // Upload files sequentially
    for (let i = 0; i < acceptedFiles.length; i++) {
      try {
        await uploadFile(acceptedFiles[i], startIndex + i, categoryToUse)
      } catch (err) {
        console.error('Upload error:', err)
      }
    }

    onDocumentsChange()
  }, [files.length, defaultCategory, uploadFile, onDocumentsChange])

  const { getRootProps, getInputProps, isDragActive, open, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
    maxSize: MAX_FILE_SIZE,
    multiple: true,
    noClick: true, // Don't open file picker on click (we'll have a button for that)
    noDragEventsBubbling: true,
  })

  const clearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status !== 'complete'))
  }

  const hasCompleted = files.some(f => f.status === 'complete')
  const hasActiveUploads = files.some(f => f.status === 'pending' || f.status === 'uploading')

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="text-muted-foreground">Documents</Label>
          {documents.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {documents.length}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select value={defaultCategory} onValueChange={(v) => setDefaultCategory(v as DocumentCategory)}>
            <SelectTrigger className="w-[100px] h-8 text-xs">
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
          <Button variant="outline" size="sm" onClick={open} className="h-8">
            <Plus className="mr-1 h-3 w-3" />
            Upload
          </Button>
        </div>
      </div>

      {/* Drop Zone - wraps entire content area */}
      <div
        {...getRootProps()}
        className={cn(
          'relative rounded-lg transition-all',
          isDragActive && 'ring-2 ring-blue-500 ring-offset-2'
        )}
      >
        <input {...getInputProps()} />

        {/* Drag overlay */}
        {isDragActive && (
          <div className="absolute inset-0 z-10 bg-blue-50/90 border-2 border-dashed border-blue-500 rounded-lg flex flex-col items-center justify-center">
            <Upload className="h-10 w-10 text-blue-500 mb-2" />
            <p className="text-blue-600 font-medium">Drop files here</p>
            <p className="text-sm text-blue-500">PDF, PNG, JPG up to 10MB</p>
          </div>
        )}

        {/* Content */}
        <div className="space-y-3">
          {/* Empty state */}
          {documents.length === 0 && !hasActiveUploads && (
            <Card className="p-6 text-center border-dashed">
              <FileText className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500 mb-1">No documents yet</p>
              <p className="text-xs text-gray-400">Drag & drop files here or click Upload</p>
            </Card>
          )}

          {/* Document List */}
          {documents.length > 0 && (
            <DocumentList
              documents={documents}
              projectId={projectId}
              onPreview={onPreview}
              onDocumentChange={onDocumentsChange}
              onReview={onReview}
              onReviewDeliverable={onReviewDeliverable}
              onReanalyze={onReanalyze}
            />
          )}

          {/* File rejections */}
          {fileRejections.length > 0 && (
            <div className="text-sm text-red-500 space-y-1">
              {fileRejections.map(({ file, errors }: FileRejection) => (
                <div key={file.name} className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span className="truncate">{file.name}: {errors.map(e => e.message).join(', ')}</span>
                </div>
              ))}
            </div>
          )}

          {/* Upload progress */}
          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Uploads</span>
                {hasCompleted && (
                  <Button variant="ghost" size="sm" onClick={clearCompleted} className="h-7 text-xs">
                    Clear completed
                  </Button>
                )}
              </div>
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.file.name}</p>
                    {f.status === 'uploading' && (
                      <Progress value={f.progress} className="h-1 mt-1" />
                    )}
                    {f.status === 'error' && (
                      <p className="text-xs text-red-500 truncate">{f.error}</p>
                    )}
                  </div>
                  {f.status === 'pending' && (
                    <div className="h-5 w-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin shrink-0" />
                  )}
                  {f.status === 'uploading' && (
                    <span className="text-xs text-muted-foreground shrink-0">{f.progress}%</span>
                  )}
                  {f.status === 'complete' && (
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                  )}
                  {f.status === 'error' && (
                    <X className="h-5 w-5 text-red-500 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
