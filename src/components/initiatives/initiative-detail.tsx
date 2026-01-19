'use client'

// Stub component - will be fully implemented in Plan 02
// This stub ensures builds pass while dead links are being removed

interface Comment {
  id: string
  content: string
  createdAt: string
  updatedAt: string
}

interface InitiativeData {
  id: string
  sequenceNumber: number
  title: string
  objective: string
  keyResult: string
  department: string
  status: string
  personInCharge: string | null
  resourcesFinancial: number | null
  startDate: string
  endDate: string
  createdAt: string
  updatedAt: string
  comments: Comment[]
  // Allow additional fields from server
  [key: string]: unknown
}

interface InitiativeDetailProps {
  initiative: InitiativeData
}

export function InitiativeDetail({ initiative }: InitiativeDetailProps) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{initiative.title}</h1>
      <p className="mt-2 text-gray-600">{initiative.objective}</p>
      <p className="mt-4 text-sm text-gray-400">
        Full detail page coming in Plan 02
      </p>
    </div>
  )
}
