'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PAYMENT_TERMS_OPTIONS } from '@/lib/supplier-utils'

interface PaymentTermsSelectProps {
  value: string | null
  onValueChange: (value: string | null) => void
  disabled?: boolean
}

export function PaymentTermsSelect({
  value,
  onValueChange,
  disabled = false,
}: PaymentTermsSelectProps) {
  return (
    <Select
      value={value || '_none'}
      onValueChange={(v) => onValueChange(v === '_none' ? null : v)}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select payment terms" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="_none">Not specified</SelectItem>
        {PAYMENT_TERMS_OPTIONS.map((option) => (
          <SelectItem key={option.id} value={option.id}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
