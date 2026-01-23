'use client'

import { useCallback } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { ConfidenceBadge } from './confidence-badge'
import { formatCurrency } from '@/lib/utils'
import {
  type InvoiceLineItem,
  type ReceiptItem,
  type ConfidenceLevel,
} from '@/types/ai-extraction'

interface CostCategory {
  id: string
  name: string
}

// Extended types for internal state management
export interface EditableInvoiceItem extends InvoiceLineItem {
  selected: boolean
}

export interface EditableReceiptItem extends ReceiptItem {
  selected: boolean
  categoryId?: string | null
}

interface ExtractionTableProps {
  type: 'invoice' | 'receipt'
  items: EditableInvoiceItem[] | EditableReceiptItem[]
  categories?: CostCategory[]
  onItemChange: (index: number, updates: Partial<EditableInvoiceItem | EditableReceiptItem>) => void
  onSelectionChange: (index: number, selected: boolean) => void
  onSelectAll: (selected: boolean) => void
}

export function ExtractionTable({
  type,
  items,
  categories = [],
  onItemChange,
  onSelectionChange,
  onSelectAll,
}: ExtractionTableProps) {
  const allSelected = items.length > 0 && items.every((item) => item.selected)
  const someSelected = items.some((item) => item.selected)

  const handleSelectAllChange = useCallback(() => {
    onSelectAll(!allSelected)
  }, [allSelected, onSelectAll])

  const total = items.reduce((sum, item) => sum + (item.selected ? item.amount : 0), 0)

  if (type === 'invoice') {
    return (
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
                onChange={handleSelectAllChange}
                className="h-4 w-4 rounded border-gray-300"
              />
            </TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="w-[80px]">Qty</TableHead>
            <TableHead className="w-[100px]">Unit Price</TableHead>
            <TableHead className="w-[100px]">Amount</TableHead>
            <TableHead className="w-[80px]">Confidence</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(items as EditableInvoiceItem[]).map((item, index) => (
            <TableRow key={index} data-state={item.selected ? 'selected' : undefined}>
              <TableCell>
                <input
                  type="checkbox"
                  checked={item.selected}
                  onChange={(e) => onSelectionChange(index, e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </TableCell>
              <TableCell>
                <Input
                  value={item.description}
                  onChange={(e) => onItemChange(index, { description: e.target.value })}
                  className="h-8 text-sm"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={item.quantity ?? ''}
                  onChange={(e) => onItemChange(index, { quantity: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="h-8 text-sm w-16"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  step="0.01"
                  value={item.unitPrice ?? ''}
                  onChange={(e) => onItemChange(index, { unitPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="h-8 text-sm w-20"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  step="0.01"
                  value={item.amount}
                  onChange={(e) => onItemChange(index, { amount: parseFloat(e.target.value) || 0 })}
                  className="h-8 text-sm w-20"
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
            <TableCell colSpan={4} className="text-right font-medium">
              Selected Total:
            </TableCell>
            <TableCell className="font-semibold">{formatCurrency(total)}</TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>
    )
  }

  // Receipt type
  return (
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
              onChange={handleSelectAllChange}
              className="h-4 w-4 rounded border-gray-300"
            />
          </TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="w-[100px]">Amount</TableHead>
          <TableHead className="w-[160px]">Category</TableHead>
          <TableHead className="w-[80px]">Confidence</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(items as EditableReceiptItem[]).map((item, index) => (
          <TableRow key={index} data-state={item.selected ? 'selected' : undefined}>
            <TableCell>
              <input
                type="checkbox"
                checked={item.selected}
                onChange={(e) => onSelectionChange(index, e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
            </TableCell>
            <TableCell>
              <Input
                value={item.description}
                onChange={(e) => onItemChange(index, { description: e.target.value })}
                className="h-8 text-sm"
              />
            </TableCell>
            <TableCell>
              <Input
                type="number"
                step="0.01"
                value={item.amount}
                onChange={(e) => onItemChange(index, { amount: parseFloat(e.target.value) || 0 })}
                className="h-8 text-sm w-20"
              />
            </TableCell>
            <TableCell>
              <Select
                value={item.categoryId || item.suggestedCategoryId || 'new'}
                onValueChange={(value) => onItemChange(index, { categoryId: value === 'new' ? null : value })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {item.suggestedCategory && !item.suggestedCategoryId && (
                    <SelectItem value="new">
                      + Create: {item.suggestedCategory}
                    </SelectItem>
                  )}
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          <TableCell className="font-semibold">{formatCurrency(total)}</TableCell>
          <TableCell colSpan={2} />
        </TableRow>
      </TableFooter>
    </Table>
  )
}
