// Document category colors for badges (matching cost-utils pattern)
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    RECEIPT: 'bg-green-100 text-green-700 border-green-200',
    INVOICE: 'bg-blue-100 text-blue-700 border-blue-200',
    OTHER: 'bg-gray-100 text-gray-700 border-gray-200',
  }
  return colors[category] || colors.OTHER
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// Check if file is previewable inline (images only)
export function isPreviewable(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

// Document category options for selects
export const DOCUMENT_CATEGORIES = [
  { value: 'RECEIPT', label: 'Receipt' },
  { value: 'INVOICE', label: 'Invoice' },
  { value: 'OTHER', label: 'Other' },
] as const

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number]['value']

// Allowed MIME types for uploads
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
]

// Maximum file size in bytes (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024
