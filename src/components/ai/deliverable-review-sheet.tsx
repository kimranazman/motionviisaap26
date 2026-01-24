'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Loader2, FileText, AlertTriangle, ExternalLink, Package } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'
import { ConfidenceBadge } from './confidence-badge'
import {
  type DeliverableExtraction,
  type DeliverableItem,
} from '@/types/ai-extraction'

interface Document {
  id: string
  filename: string
  storagePath: string
  mimeType: string
  category: string
}

// Editable deliverable item with selection state
interface EditableDeliverableItem extends DeliverableItem {
  selected: boolean
}

interface DeliverableReviewSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  document: Document
  extraction: DeliverableExtraction
  onImportComplete: () => void
}

export function DeliverableReviewSheet({
  open,
  onOpenChange,
  projectId,
  document,
  extraction,
  onImportComplete,
}: DeliverableReviewSheetProps) {
  const [isImporting, setIsImporting] = useState(false)
  const [items, setItems] = useState<EditableDeliverableItem[]>([])

  // Initialize editable items from extraction
  useEffect(() => {
    if (!open) return

    const editableItems = extraction.deliverables.map((item) => ({
      ...item,
      selected: item.confidence === 'HIGH' || item.confidence === 'MEDIUM',
    }))
    setItems(editableItems)
  }, [open, extraction])

  // Item change handlers
  const handleItemChange = useCallback(
    (index: number, updates: Partial<EditableDeliverableItem>) => {
      setItems((prev) =>
        prev.map((item, i) => (i === index ? { ...item, ...updates } : item))
      )
    },
    []
  )

  const handleSelectionChange = useCallback((index: number, selected: boolean) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, selected } : item))
    )
  }, [])

  const handleSelectAll = useCallback((selected: boolean) => {
    setItems((prev) => prev.map((item) => ({ ...item, selected })))
  }, [])

  // Import action
  const handleImport = async () => {
    setIsImporting(true)

    try {
      const selectedItems = items.filter((item) => item.selected)

      const payload = {
        projectId,
        documentId: document.id,
        extraction: {
          ...extraction,
          deliverables: selectedItems.map((item): DeliverableItem => ({
            title: item.title,
            description: item.description,
            value: item.value,
            confidence: item.confidence,
          })),
        },
      }

      const response = await fetch('/api/ai/import/deliverable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to import deliverables')
      }

      const result = await response.json()

      toast.success('Deliverables imported successfully', {
        description: `Created ${result.createdCount} deliverable${result.createdCount !== 1 ? 's' : ''}`,
      })

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

  const selectedCount = items.filter((i) => i.selected).length
  const totalCount = items.length
  const selectedTotal = items
    .filter((i) => i.selected)
    .reduce((sum, item) => sum + item.value, 0)

  const allSelected = items.length > 0 && items.every((item) => item.selected)
  const someSelected = items.some((item) => item.selected)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="bg-purple-50 text-purple-700 border-purple-200"
            >
              <Package className="mr-1 h-3 w-3" />
              Deliverables
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
                  <span className="font-medium">{extraction.documentType}</span>
                </div>
                {extraction.issuer && (
                  <div>
                    <span className="text-muted-foreground">Issuer:</span>{' '}
                    <span className="font-medium">{extraction.issuer}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Document Total:</span>{' '}
                  <span className="font-semibold">{formatCurrency(extraction.documentTotal)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Items:</span>{' '}
                  <span className="font-medium">{extraction.deliverables.length}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Deliverables Table */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Deliverables ({selectedCount}/{totalCount} selected)
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = someSelected && !allSelected
                        }}
                        onChange={() => handleSelectAll(!allSelected)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="w-[120px]">Value</TableHead>
                    <TableHead className="w-[80px]">Confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index} data-state={item.selected ? 'selected' : undefined}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={(e) => handleSelectionChange(index, e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.title}
                          onChange={(e) => handleItemChange(index, { title: e.target.value })}
                          className="h-8 text-sm"
                        />
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {item.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.value}
                          onChange={(e) => handleItemChange(index, { value: parseFloat(e.target.value) || 0 })}
                          className="h-8 text-sm w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <ConfidenceBadge confidence={item.confidence} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={2} className="text-right font-medium">
                      Selected Total:
                    </TableCell>
                    <TableCell className="font-semibold">{formatCurrency(selectedTotal)}</TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
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

            {/* Notes */}
            {extraction.notes && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
                  <p className="text-sm text-muted-foreground bg-gray-50 px-3 py-2 rounded-md">
                    {extraction.notes}
                  </p>
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
            Import {selectedCount} Deliverable{selectedCount !== 1 ? 's' : ''}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
