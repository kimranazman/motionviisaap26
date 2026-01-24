'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Loader2, FileText, AlertTriangle, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { cn, formatCurrency } from '@/lib/utils'
import { ConfidenceBadge } from './confidence-badge'
import {
  ExtractionTable,
  type EditableInvoiceItem,
  type EditableReceiptItem,
} from './extraction-table'
import {
  type InvoiceExtraction,
  type ReceiptExtraction,
  type InvoiceLineItem,
  type ReceiptItem,
} from '@/types/ai-extraction'

interface CostCategory {
  id: string
  name: string
}

interface Document {
  id: string
  filename: string
  storagePath: string
  mimeType: string
  category: string
}

interface AIReviewSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  document: Document
  extraction: InvoiceExtraction | ReceiptExtraction
  categories: CostCategory[]
  onImportComplete: () => void
}

function isInvoiceExtraction(
  extraction: InvoiceExtraction | ReceiptExtraction
): extraction is InvoiceExtraction {
  return 'lineItems' in extraction
}

export function AIReviewSheet({
  open,
  onOpenChange,
  projectId,
  document,
  extraction,
  categories,
  onImportComplete,
}: AIReviewSheetProps) {
  const [isImporting, setIsImporting] = useState(false)
  const [invoiceItems, setInvoiceItems] = useState<EditableInvoiceItem[]>([])
  const [receiptItems, setReceiptItems] = useState<EditableReceiptItem[]>([])

  const isInvoice = isInvoiceExtraction(extraction)

  // Initialize editable items from extraction
  useEffect(() => {
    if (!open) return

    if (isInvoice) {
      const items = (extraction as InvoiceExtraction).lineItems.map((item) => ({
        ...item,
        selected: item.confidence === 'HIGH' || item.confidence === 'MEDIUM',
      }))
      setInvoiceItems(items)
    } else {
      const items = (extraction as ReceiptExtraction).items.map((item) => ({
        ...item,
        selected: item.confidence === 'HIGH' || item.confidence === 'MEDIUM',
        categoryId: item.suggestedCategoryId || null,
      }))
      setReceiptItems(items)
    }
  }, [open, extraction, isInvoice])

  // Invoice item handlers
  const handleInvoiceItemChange = useCallback(
    (index: number, updates: Partial<EditableInvoiceItem>) => {
      setInvoiceItems((prev) =>
        prev.map((item, i) => (i === index ? { ...item, ...updates } : item))
      )
    },
    []
  )

  const handleInvoiceSelectionChange = useCallback(
    (index: number, selected: boolean) => {
      setInvoiceItems((prev) =>
        prev.map((item, i) => (i === index ? { ...item, selected } : item))
      )
    },
    []
  )

  const handleInvoiceSelectAll = useCallback((selected: boolean) => {
    setInvoiceItems((prev) => prev.map((item) => ({ ...item, selected })))
  }, [])

  // Receipt item handlers
  const handleReceiptItemChange = useCallback(
    (index: number, updates: Partial<EditableReceiptItem>) => {
      setReceiptItems((prev) =>
        prev.map((item, i) => (i === index ? { ...item, ...updates } : item))
      )
    },
    []
  )

  const handleReceiptSelectionChange = useCallback(
    (index: number, selected: boolean) => {
      setReceiptItems((prev) =>
        prev.map((item, i) => (i === index ? { ...item, selected } : item))
      )
    },
    []
  )

  const handleReceiptSelectAll = useCallback((selected: boolean) => {
    setReceiptItems((prev) => prev.map((item) => ({ ...item, selected })))
  }, [])

  // Import action
  const handleImport = async () => {
    setIsImporting(true)

    try {
      if (isInvoice) {
        // Calculate total from selected items
        const selectedTotal = invoiceItems
          .filter((item) => item.selected)
          .reduce((sum, item) => sum + item.amount, 0)

        const payload: InvoiceExtraction = {
          ...(extraction as InvoiceExtraction),
          lineItems: invoiceItems
            .filter((item) => item.selected)
            .map((item): InvoiceLineItem => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              amount: item.amount,
              confidence: item.confidence,
            })),
          total: selectedTotal,
        }

        const response = await fetch('/api/ai/import/invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, extraction: payload }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to import invoice')
        }

        toast.success('Invoice imported successfully', {
          description: `Added ${formatCurrency(selectedTotal)} to project revenue`,
        })
      } else {
        // Receipt import - send selected items with category assignments
        const selectedItems: ReceiptItem[] = receiptItems
          .filter((item) => item.selected)
          .map((item) => ({
            description: item.description,
            amount: item.amount,
            suggestedCategory: item.suggestedCategory,
            suggestedCategoryId: item.categoryId || undefined,
            confidence: item.confidence,
          }))

        const payload: ReceiptExtraction = {
          ...(extraction as ReceiptExtraction),
          items: selectedItems,
          total: selectedItems.reduce((sum, item) => sum + item.amount, 0),
        }

        const response = await fetch('/api/ai/import/receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, extraction: payload }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to import receipt')
        }

        toast.success('Receipt imported successfully', {
          description: `Created ${selectedItems.length} cost entries`,
        })
      }

      onImportComplete()
      onOpenChange(false)
    } catch (error) {
      console.error('Import failed:', error)
      toast.error('Import failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setIsImporting(false)
    }
  }

  // Get document preview URL
  const getDocumentUrl = () => {
    const storageFilename = document.storagePath.split('/').pop() || ''
    return `/api/files/${projectId}/${storageFilename}`
  }

  const isImage = document.mimeType.startsWith('image/')
  const isPdf = document.mimeType === 'application/pdf'

  // Extract metadata based on type
  const extractionDate = isInvoice
    ? (extraction as InvoiceExtraction).invoiceDate
    : (extraction as ReceiptExtraction).receiptDate
  const extractionEntity = isInvoice
    ? (extraction as InvoiceExtraction).vendor
    : (extraction as ReceiptExtraction).merchant

  const selectedCount = isInvoice
    ? invoiceItems.filter((i) => i.selected).length
    : receiptItems.filter((i) => i.selected).length
  const totalCount = isInvoice ? invoiceItems.length : receiptItems.length

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className={cn(
                document.category === 'INVOICE'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-purple-50 text-purple-700 border-purple-200'
              )}
            >
              {document.category}
            </Badge>
            <SheetTitle className="text-left text-lg leading-snug truncate flex-1">
              {document.filename}
            </SheetTitle>
            <ConfidenceBadge confidence={extraction.confidence} />
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-4">
            {/* Document Preview */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Document Preview
              </h3>
              {isImage ? (
                <div className="border rounded-lg overflow-hidden bg-muted/30">
                  <img
                    src={getDocumentUrl()}
                    alt={document.filename}
                    className="w-full max-h-[300px] object-contain"
                  />
                </div>
              ) : isPdf ? (
                <div className="border rounded-lg p-4 bg-muted/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm">{document.filename}</span>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={getDocumentUrl()} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-1 h-4 w-4" />
                      Open PDF
                    </a>
                  </Button>
                </div>
              ) : (
                <div className="border rounded-lg p-4 bg-muted/30 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Preview not available for this file type
                  </span>
                </div>
              )}
            </div>

            {/* Extraction Summary */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Extraction Summary
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Type:</span>{' '}
                  <span className="font-medium">{isInvoice ? 'Invoice' : 'Receipt'}</span>
                </div>
                {extractionDate && (
                  <div>
                    <span className="text-muted-foreground">Date:</span>{' '}
                    <span className="font-medium">{extractionDate}</span>
                  </div>
                )}
                {extractionEntity && (
                  <div>
                    <span className="text-muted-foreground">
                      {isInvoice ? 'Vendor' : 'Merchant'}:
                    </span>{' '}
                    <span className="font-medium">{extractionEntity}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Total:</span>{' '}
                  <span className="font-semibold">{formatCurrency(extraction.total)}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Extraction Table */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Line Items ({selectedCount}/{totalCount} selected)
              </h3>
              {isInvoice ? (
                <ExtractionTable
                  type="invoice"
                  items={invoiceItems}
                  onItemChange={handleInvoiceItemChange}
                  onSelectionChange={handleInvoiceSelectionChange}
                  onSelectAll={handleInvoiceSelectAll}
                />
              ) : (
                <ExtractionTable
                  type="receipt"
                  items={receiptItems}
                  categories={categories}
                  onItemChange={handleReceiptItemChange}
                  onSelectionChange={handleReceiptSelectionChange}
                  onSelectAll={handleReceiptSelectAll}
                />
              )}
            </div>

            {/* Warnings Section */}
            {extraction.warnings && extraction.warnings.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    Warnings
                  </h3>
                  <div className="space-y-1">
                    {extraction.warnings.map((warning, index) => (
                      <p
                        key={index}
                        className="text-sm text-yellow-700 bg-yellow-50 px-3 py-2 rounded-md"
                      >
                        {warning}
                      </p>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <SheetFooter className="p-4 border-t flex-col sm:flex-row gap-2 sm:gap-0 justify-between sm:justify-between">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isImporting}
          >
            Discard
          </Button>
          <Button
            onClick={handleImport}
            disabled={isImporting || selectedCount === 0}
          >
            {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import {selectedCount} Item{selectedCount !== 1 ? 's' : ''}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
