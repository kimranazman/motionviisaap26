// Payment terms options for forms and dropdowns
export const PAYMENT_TERMS_OPTIONS = [
  { id: 'IMMEDIATE', label: 'Immediate', description: 'Payment due upon receipt' },
  { id: 'NET_7', label: 'Net 7', description: 'Payment due within 7 days' },
  { id: 'NET_15', label: 'Net 15', description: 'Payment due within 15 days' },
  { id: 'NET_30', label: 'Net 30', description: 'Payment due within 30 days' },
  { id: 'NET_45', label: 'Net 45', description: 'Payment due within 45 days' },
  { id: 'NET_60', label: 'Net 60', description: 'Payment due within 60 days' },
  { id: 'NET_90', label: 'Net 90', description: 'Payment due within 90 days' },
] as const

// Format payment terms enum value to human-readable label
export function formatPaymentTerms(terms: string | null): string {
  if (!terms) return 'Not specified'

  const option = PAYMENT_TERMS_OPTIONS.find(opt => opt.id === terms)
  return option?.label || 'Not specified'
}

// Get Tailwind badge classes for payment terms
export function getPaymentTermsColor(terms: string | null): string {
  switch (terms) {
    case 'IMMEDIATE':
      return 'bg-red-50 text-red-700 border-red-200'
    case 'NET_7':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'NET_15':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200'
    case 'NET_30':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'NET_45':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200'
    case 'NET_60':
      return 'bg-purple-50 text-purple-700 border-purple-200'
    case 'NET_90':
      return 'bg-violet-50 text-violet-700 border-violet-200'
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200'
  }
}

// Get badge info for credit status
export function getCreditStatusBadge(acceptsCredit: boolean): { label: string; color: string } {
  if (acceptsCredit) {
    return {
      label: 'Accepts Credit',
      color: 'bg-green-50 text-green-700 border-green-200'
    }
  }
  return {
    label: 'No Credit',
    color: 'bg-gray-50 text-gray-700 border-gray-200'
  }
}
