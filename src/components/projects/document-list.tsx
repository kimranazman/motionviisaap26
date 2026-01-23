'use client'

import { useState } from 'react'
import { DocumentCard } from './document-card'
import { cn } from '@/lib/utils'
import { type DocumentCategory, type DocumentAIStatus } from '@/lib/document-utils'

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

interface DocumentListProps {
  documents: Document[]
  projectId: string
  onPreview: (document: Document) => void
  onDocumentChange: () => void
  onReview?: (document: Document) => void
}

const CATEGORY_TABS = [
  { id: 'ALL', label: 'All' },
  { id: 'RECEIPT', label: 'Receipt' },
  { id: 'INVOICE', label: 'Invoice' },
  { id: 'OTHER', label: 'Other' },
] as const

type FilterCategory = 'ALL' | DocumentCategory

export function DocumentList({
  documents,
  projectId,
  onPreview,
  onDocumentChange,
  onReview,
}: DocumentListProps) {
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('ALL')

  const filteredDocuments = selectedCategory === 'ALL'
    ? documents
    : documents.filter(d => d.category === selectedCategory)

  // Category change is handled by DocumentCard, we just need to trigger refresh
  const handleCategoryChange = () => onDocumentChange()

  return (
    <div className="space-y-3">
      {/* Filter tabs */}
      {documents.length > 0 && (
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg overflow-x-auto">
          {CATEGORY_TABS.map((tab) => {
            const count = tab.id === 'ALL'
              ? documents.length
              : documents.filter(d => d.category === tab.id).length
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id as FilterCategory)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap',
                  selectedCategory === tab.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                {tab.label} ({count})
              </button>
            )
          })}
        </div>
      )}

      {/* Document list */}
      {filteredDocuments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          {documents.length === 0
            ? 'No documents yet'
            : 'No documents in this category'}
        </p>
      ) : (
        <div className="space-y-2">
          {filteredDocuments.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              projectId={projectId}
              onPreview={onPreview}
              onCategoryChange={handleCategoryChange}
              onDelete={onDocumentChange}
              onReview={onReview}
            />
          ))}
        </div>
      )}
    </div>
  )
}
