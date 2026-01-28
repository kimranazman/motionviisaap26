// AI Document Intelligence Types (Phase 25)
// Types for AI extraction workflow - manifest generation and extraction results

// Confidence level for AI-extracted data
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW'

// Invoice line item extracted by AI
export interface InvoiceLineItem {
  description: string
  quantity?: number
  unitPrice?: number
  amount: number
  confidence: ConfidenceLevel
}

// Full invoice extraction result
export interface InvoiceExtraction {
  documentId: string
  confidence: ConfidenceLevel
  invoiceNumber?: string
  invoiceDate?: string
  vendor?: string
  lineItems: InvoiceLineItem[]
  subtotal?: number
  tax?: number
  total: number
  notes?: string
  warnings?: string[]
}

// Receipt item extracted by AI
export interface ReceiptItem {
  description: string
  amount: number
  quantity?: number
  unitPrice?: number
  suggestedCategory?: string
  suggestedCategoryId?: string
  confidence: ConfidenceLevel
}

// Full receipt extraction result
export interface ReceiptExtraction {
  documentId: string
  confidence: ConfidenceLevel
  merchant?: string
  receiptDate?: string
  items: ReceiptItem[]
  total: number
  paymentMethod?: string
  notes?: string
  warnings?: string[]
}

// Deliverable item extracted from quote/invoice (v1.4 - Phase 32)
export interface DeliverableItem {
  title: string
  description?: string
  value: number
  confidence: ConfidenceLevel
}

// Deliverable extraction from Talenta/Motionvii quote/invoice
export interface DeliverableExtraction {
  documentId: string
  confidence: ConfidenceLevel
  documentType: 'QUOTE' | 'INVOICE'
  issuer?: string  // "Talenta" or "Motionvii"
  deliverables: DeliverableItem[]
  documentTotal: number
  notes?: string
  warnings?: string[]
}

// Bulk AI analysis result (multiple documents)
export interface AIAnalysisResult {
  version: '1.0'
  analyzedAt: string
  projectId: string
  invoices: InvoiceExtraction[]
  receipts: ReceiptExtraction[]
  deliverables?: DeliverableExtraction[]  // Optional for backward compatibility
  errors?: {
    documentId: string
    error: string
  }[]
}

// Document entry in manifest
export interface ManifestDocument {
  id: string
  filename: string
  category: 'RECEIPT' | 'INVOICE' | 'OTHER'
  path: string
  mimeType: string
  size: number
  uploadedAt: string
  aiStatus: 'PENDING' | 'ANALYZED' | 'IMPORTED' | 'FAILED'
}

// Existing cost entry for context
export interface ManifestCost {
  description: string
  amount: number
  category: string
  date: string
}

// Project manifest for AI context
export interface ProjectManifest {
  version: '1.0'
  generatedAt: string
  project: {
    id: string
    title: string
    company: string
    startDate?: string
    endDate?: string
    status: string
  }
  existingCategories: {
    id: string
    name: string
  }[]
  documents: {
    pendingAnalysis: ManifestDocument[]
    alreadyAnalyzed: ManifestDocument[]
  }
  existingCosts: ManifestCost[]
}
