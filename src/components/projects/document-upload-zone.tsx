'use client'

import { useCallback, useState } from 'react'
import { useDropzone, FileRejection } from 'react-dropzone'
import { Upload, AlertCircle, CheckCircle, X } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MAX_FILE_SIZE, DOCUMENT_CATEGORIES, type DocumentCategory } from '@/lib/document-utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface FileWithProgress {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'complete' | 'error'
  error?: string
}

interface DocumentUploadZoneProps {
  projectId: string
  onUploadComplete: () => void
}

export function DocumentUploadZone({ projectId, onUploadComplete }: DocumentUploadZoneProps) {
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

    // Upload files sequentially (to avoid memory issues with large files)
    for (let i = 0; i < acceptedFiles.length; i++) {
      try {
        await uploadFile(acceptedFiles[i], startIndex + i, categoryToUse)
      } catch (err) {
        console.error('Upload error:', err)
      }
    }

    onUploadComplete()
  }, [files.length, defaultCategory, uploadFile, onUploadComplete])

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
    maxSize: MAX_FILE_SIZE,
    multiple: true,
  })

  const clearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status !== 'complete'))
  }

  const hasCompleted = files.some(f => f.status === 'complete')

  return (
    <div className="space-y-4">
      {/* Category selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Upload as:</span>
        <Select value={defaultCategory} onValueChange={(v) => setDefaultCategory(v as DocumentCategory)}>
          <SelectTrigger className="w-[120px] h-9">
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
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          'min-h-[120px] flex flex-col items-center justify-center',
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-8 w-8 text-gray-400 mb-2" />
        {isDragActive ? (
          <p className="text-blue-600 font-medium">Drop files here...</p>
        ) : (
          <>
            <p className="text-gray-600 font-medium">Drag & drop files here</p>
            <p className="text-sm text-gray-400 mt-1">or click to select files</p>
            <p className="text-xs text-gray-400 mt-2">PDF, PNG, JPG up to 10MB</p>
          </>
        )}
      </div>

      {/* File rejections (validation errors) */}
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

      {/* Upload progress list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Uploads</span>
            {hasCompleted && (
              <Button variant="ghost" size="sm" onClick={clearCompleted}>
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
  )
}
