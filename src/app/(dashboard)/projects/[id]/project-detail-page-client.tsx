'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ArrowLeft,
  Building2,
  User,
  Target,
  Calendar,
  ArrowRight,
  DollarSign,
  Package,
  ListChecks,
  FileText,
  Pencil,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'
import {
  getProjectStatusColor,
  formatProjectStatus,
} from '@/lib/project-utils'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { calculateTotalCosts, calculateProfit, getCategoryColor } from '@/lib/cost-utils'
import { TaskTree } from '@/components/projects/task-tree'
import { DocumentsSection } from '@/components/projects/documents-section'
import { ImagePreviewDialog } from '@/components/projects/image-preview-dialog'
import { AIReviewSheet } from '@/components/ai/ai-review-sheet'
import { DeliverableReviewSheet } from '@/components/ai/deliverable-review-sheet'
import { type DocumentCategory, type DocumentAIStatus } from '@/lib/document-utils'
import { InvoiceExtraction, ReceiptExtraction, DeliverableExtraction } from '@/types/ai-extraction'

interface Cost {
  id: string
  description: string
  amount: number
  date: string
  categoryId: string
  category: { id: string; name: string }
  aiImported?: boolean
}

interface Deliverable {
  id: string
  title: string
  description: string | null
  value: number | null
  sortOrder: number
  aiExtracted?: boolean
}

interface Task {
  id: string
  title: string
  description: string | null
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  dueDate: string | null
  assignee: string | null
  projectId: string
  parentId: string | null
  depth: number
  sortOrder: number
  createdAt: string
  updatedAt: string
  tags?: { tag: { id: string; name: string; color: string }; inherited: boolean }[]
  _count?: { children: number; comments: number }
}

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

interface Project {
  id: string
  title: string
  description: string | null
  revenue: number | null
  potentialRevenue: number | null
  status: string
  startDate: string | null
  endDate: string | null
  isArchived?: boolean
  company: { id: string; name: string } | null
  contact: { id: string; name: string } | null
  initiative: { id: string; title: string } | null
  sourceDeal: { id: string; title: string; stageChangedAt?: string } | null
  sourcePotential: { id: string; title: string } | null
  costs?: Cost[]
}

interface ProjectDetailPageClientProps {
  project: Project
}

export function ProjectDetailPageClient({ project }: ProjectDetailPageClientProps) {
  const router = useRouter()
  const [deliverables, setDeliverables] = useState<Deliverable[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoadingDeliverables, setIsLoadingDeliverables] = useState(true)
  const [isLoadingTasks, setIsLoadingTasks] = useState(true)
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true)
  const [categories, setCategories] = useState<{ id: string; name: string; description: string | null }[]>([])

  // Image preview state
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  // AI Review state
  const [reviewDocument, setReviewDocument] = useState<Document | null>(null)
  const [reviewExtraction, setReviewExtraction] = useState<InvoiceExtraction | ReceiptExtraction | null>(null)
  const [isReviewSheetOpen, setIsReviewSheetOpen] = useState(false)

  // Deliverable Review state
  const [reviewDeliverableDocument, setReviewDeliverableDocument] = useState<Document | null>(null)
  const [reviewDeliverableExtraction, setReviewDeliverableExtraction] = useState<DeliverableExtraction | null>(null)
  const [isDeliverableReviewSheetOpen, setIsDeliverableReviewSheetOpen] = useState(false)

  const costs = project.costs || []
  const totalCosts = calculateTotalCosts(costs)
  const revenue = project.revenue ?? project.potentialRevenue ?? 0
  const profit = calculateProfit(revenue, totalCosts)
  const aiImportedCostsCount = costs.filter(c => c.aiImported).length

  // Fetch cost categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/cost-categories')
        if (response.ok) {
          setCategories(await response.json())
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      }
    }
    fetchCategories()
  }, [])

  // Fetch deliverables
  useEffect(() => {
    const fetchDeliverables = async () => {
      try {
        const response = await fetch(`/api/projects/${project.id}/deliverables`)
        if (response.ok) {
          const data = await response.json()
          setDeliverables(data)
        }
      } catch (error) {
        console.error('Failed to fetch deliverables:', error)
      } finally {
        setIsLoadingDeliverables(false)
      }
    }
    fetchDeliverables()
  }, [project.id])

  // Fetch tasks
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch(`/api/projects/${project.id}/tasks`)
        if (response.ok) {
          const data = await response.json()
          setTasks(data)
        }
      } catch (error) {
        console.error('Failed to fetch tasks:', error)
      } finally {
        setIsLoadingTasks(false)
      }
    }
    fetchTasks()
  }, [project.id])

  // Fetch documents
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch(`/api/projects/${project.id}/documents`)
        if (response.ok) {
          const data = await response.json()
          setDocuments(data)
        }
      } catch (error) {
        console.error('Failed to fetch documents:', error)
      } finally {
        setIsLoadingDocuments(false)
      }
    }
    fetchDocuments()
  }, [project.id])

  // Refresh helpers
  const refreshDocuments = async () => {
    try {
      const response = await fetch(`/api/projects/${project.id}/documents`)
      if (response.ok) {
        setDocuments(await response.json())
      }
    } catch (error) {
      console.error('Failed to refresh documents:', error)
    }
  }

  // Handlers for document interactions
  const handlePreviewDocument = (doc: Document) => {
    setPreviewDocument(doc)
    setIsPreviewOpen(true)
  }

  const handleReviewDocument = async (doc: Document) => {
    try {
      const response = await fetch(`/api/projects/${project.id}/documents/${doc.id}/extraction`)
      if (response.ok) {
        const extraction = await response.json()
        setReviewDocument(doc)
        setReviewExtraction(extraction)
        setIsReviewSheetOpen(true)
      }
    } catch (error) {
      console.error('Failed to fetch extraction:', error)
    }
  }

  const handleReviewDeliverables = async (doc: Document) => {
    try {
      const response = await fetch(`/api/projects/${project.id}/documents/${doc.id}/extraction`)
      if (response.ok) {
        const extraction = await response.json()
        setReviewDeliverableDocument(doc)
        setReviewDeliverableExtraction(extraction)
        setIsDeliverableReviewSheetOpen(true)
      }
    } catch (error) {
      console.error('Failed to fetch deliverable extraction:', error)
    }
  }

  const handleDocumentsChange = () => {
    refreshDocuments()
  }

  const handleImportResult = () => {
    // Refresh both costs and documents
    router.refresh()
    refreshDocuments()
  }

  const handleImportDeliverables = () => {
    // Refresh deliverables and documents
    const fetchAll = async () => {
      try {
        const [delRes, docsRes] = await Promise.all([
          fetch(`/api/projects/${project.id}/deliverables`),
          fetch(`/api/projects/${project.id}/documents`),
        ])
        if (delRes.ok) setDeliverables(await delRes.json())
        if (docsRes.ok) setDocuments(await docsRes.json())
      } catch (error) {
        console.error('Failed to refresh:', error)
      }
    }
    fetchAll()
  }

  const handleTaskUpdate = () => {
    const fetchTasks = async () => {
      try {
        const response = await fetch(`/api/projects/${project.id}/tasks`)
        if (response.ok) {
          setTasks(await response.json())
        }
      } catch (error) {
        console.error('Failed to refresh tasks:', error)
      }
    }
    fetchTasks()
  }

  // Financials computation
  const potentialValue = project.potentialRevenue ?? 0
  const actualValue = project.revenue ?? 0
  const hasPotential = potentialValue > 0
  const hasActual = actualValue > 0
  const hasBothRevenues = hasPotential && hasActual
  const variance = actualValue - potentialValue
  const variancePercent = potentialValue > 0
    ? Math.round((variance / potentialValue) * 100)
    : 0
  const isAboveEstimate = variance > 0
  const isBelowEstimate = variance < 0
  const revenueForProfit = hasActual ? actualValue : potentialValue
  const margin = revenueForProfit > 0
    ? Math.round(((revenueForProfit - totalCosts) / revenueForProfit) * 100)
    : 0
  const isProfitable = profit > 0
  const isLoss = profit < 0
  const isBreakEven = profit === 0
  const ProfitIcon = isProfitable ? TrendingUp : isLoss ? TrendingDown : Minus
  const hasNoFinancialData = potentialValue === 0 && actualValue === 0 && totalCosts === 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center gap-3 md:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/projects')}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge className={cn('shrink-0', getProjectStatusColor(project.status))}>
                  {formatProjectStatus(project.status)}
                </Badge>
                {project.isArchived && (
                  <Badge variant="outline" className="text-gray-500">
                    Archived
                  </Badge>
                )}
              </div>
              <h1 className="text-xl font-semibold text-gray-900 truncate">
                {project.title}
              </h1>
              {project.company && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {project.company.name}
                </p>
              )}
            </div>
            <Link href={`/projects?open=${project.id}`}>
              <Button variant="outline" size="sm">
                <Pencil className="h-4 w-4 mr-1.5" />
                Edit
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-6">

        {/* Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
              {/* Company */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  Company
                </label>
                <div className="h-9 px-3 flex items-center text-sm bg-gray-50 rounded-md border">
                  {project.company?.name || 'No company'}
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  Contact
                </label>
                <div className="h-9 px-3 flex items-center text-sm bg-gray-50 rounded-md border">
                  {project.contact?.name || 'No contact'}
                </div>
              </div>

              {/* KRI Link */}
              {project.initiative && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5" />
                    Initiative
                  </label>
                  <div className="h-9 px-3 flex items-center text-sm bg-gray-50 rounded-md border">
                    {project.initiative.title}
                  </div>
                </div>
              )}

              {/* Start Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Start Date
                </label>
                <div className="h-9 px-3 flex items-center text-sm bg-gray-50 rounded-md border">
                  {project.startDate ? formatDate(project.startDate) : 'Not set'}
                </div>
              </div>

              {/* End Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  End Date
                </label>
                <div className="h-9 px-3 flex items-center text-sm bg-gray-50 rounded-md border">
                  {project.endDate ? formatDate(project.endDate) : 'Not set'}
                </div>
              </div>

              {/* Source */}
              {(project.sourceDeal || project.sourcePotential) && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                    <ArrowRight className="h-3.5 w-3.5" />
                    Source
                  </label>
                  <div className="h-9 px-3 flex items-center text-sm bg-gray-50 rounded-md border">
                    {project.sourceDeal
                      ? `Deal: ${project.sourceDeal.title}`
                      : project.sourcePotential
                        ? `Potential: ${project.sourcePotential.title}`
                        : ''}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {project.description && (
              <div className="mt-4 space-y-1.5">
                <label className="text-xs font-medium text-gray-500">Description</label>
                <div className="text-sm text-gray-700 p-3 bg-gray-50 rounded-md border min-h-[60px] whitespace-pre-wrap">
                  {project.description}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financials Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Financials
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasNoFinancialData ? (
              <div className="text-center py-6 border-dashed border rounded-lg">
                <DollarSign className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">No financial data yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Revenue will appear after deal conversion or invoice import
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Revenue cards */}
                <div className="grid grid-cols-2 gap-3">
                  <Card className={cn(
                    'p-3',
                    hasPotential ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                  )}>
                    <div className="flex items-center gap-2">
                      <Target className={cn('h-4 w-4', hasPotential ? 'text-blue-600' : 'text-gray-400')} />
                      <div className={cn('text-xs font-medium', hasPotential ? 'text-blue-600' : 'text-gray-500')}>
                        Potential
                      </div>
                    </div>
                    <div className={cn('text-lg font-semibold mt-1', hasPotential ? 'text-blue-700' : 'text-gray-500')}>
                      {formatCurrency(potentialValue)}
                    </div>
                    <div className={cn('text-xs mt-0.5', hasPotential ? 'text-blue-600/70' : 'text-gray-400')}>
                      {hasPotential ? 'From deal/estimate' : 'No estimate'}
                    </div>
                  </Card>

                  <Card className={cn(
                    'p-3',
                    hasActual ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  )}>
                    <div className="flex items-center gap-2">
                      <TrendingUp className={cn('h-4 w-4', hasActual ? 'text-green-600' : 'text-gray-400')} />
                      <div className={cn('text-xs font-medium', hasActual ? 'text-green-600' : 'text-gray-500')}>
                        Actual
                      </div>
                      {hasActual && (
                        <div className="flex items-center gap-0.5 bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                          <Sparkles className="h-2.5 w-2.5" />
                          AI
                        </div>
                      )}
                    </div>
                    <div className={cn('text-lg font-semibold mt-1', hasActual ? 'text-green-700' : 'text-gray-500')}>
                      {formatCurrency(actualValue)}
                    </div>
                    <div className={cn('text-xs mt-0.5', hasActual ? 'text-green-600/70' : 'text-gray-400')}>
                      {hasActual ? 'From invoice' : 'No invoices yet'}
                    </div>
                  </Card>
                </div>

                {/* Variance */}
                {hasBothRevenues && (
                  <Card className={cn(
                    'p-2 px-3',
                    isAboveEstimate && 'bg-green-50 border-green-200',
                    isBelowEstimate && 'bg-amber-50 border-amber-200',
                    variance === 0 && 'bg-gray-50 border-gray-200'
                  )}>
                    <div className="flex items-center justify-between text-sm">
                      <span className={cn(
                        'font-medium',
                        isAboveEstimate && 'text-green-700',
                        isBelowEstimate && 'text-amber-700',
                        variance === 0 && 'text-gray-600'
                      )}>
                        Variance
                      </span>
                      <span className={cn(
                        'font-semibold',
                        isAboveEstimate && 'text-green-700',
                        isBelowEstimate && 'text-amber-700',
                        variance === 0 && 'text-gray-600'
                      )}>
                        {isAboveEstimate ? '+' : ''}{formatCurrency(variance)} ({isAboveEstimate ? '+' : ''}{variancePercent}%)
                      </span>
                    </div>
                  </Card>
                )}

                {/* Total Costs */}
                <Card className="p-3 bg-red-50 border-red-200">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <div className="text-xs text-red-600 font-medium">Total Costs</div>
                    {aiImportedCostsCount > 0 && (
                      <div className="flex items-center gap-0.5 bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                        <Sparkles className="h-2.5 w-2.5" />
                        AI
                      </div>
                    )}
                  </div>
                  <div className="text-lg font-semibold text-red-700 mt-1">
                    {formatCurrency(totalCosts)}
                  </div>
                  <div className="text-xs text-red-600/70 mt-0.5">
                    {aiImportedCostsCount > 0
                      ? `${aiImportedCostsCount} of ${costs.length} from AI`
                      : `From ${costs.length} expense${costs.length !== 1 ? 's' : ''}`}
                  </div>
                </Card>

                {/* Profit/Loss */}
                <Card className={cn(
                  'p-3 overflow-hidden',
                  isProfitable && 'bg-green-100 border-green-200',
                  isLoss && 'bg-red-100 border-red-200',
                  isBreakEven && 'bg-gray-100 border-gray-200'
                )}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <ProfitIcon className={cn(
                          'h-4 w-4 flex-shrink-0',
                          isProfitable && 'text-green-700',
                          isLoss && 'text-red-700',
                          isBreakEven && 'text-gray-600'
                        )} />
                        <div className={cn(
                          'text-xs font-medium',
                          isProfitable && 'text-green-700',
                          isLoss && 'text-red-700',
                          isBreakEven && 'text-gray-600'
                        )}>
                          {isProfitable ? 'Profit' : isLoss ? 'Loss' : 'Break-even'}
                        </div>
                      </div>
                      <div className={cn(
                        'text-xl font-bold mt-1 truncate',
                        isProfitable && 'text-green-800',
                        isLoss && 'text-red-800',
                        isBreakEven && 'text-gray-700'
                      )}>
                        {formatCurrency(Math.abs(profit))}
                      </div>
                    </div>
                    {revenueForProfit > 0 && (
                      <div className={cn(
                        'text-right flex-shrink-0 whitespace-nowrap',
                        isProfitable && 'text-green-700',
                        isLoss && 'text-red-700',
                        isBreakEven && 'text-gray-600'
                      )}>
                        <div className="text-xs font-medium">Margin</div>
                        <div className="text-lg font-semibold">{margin}%</div>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deliverables Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Deliverables
              {deliverables.length > 0 && (
                <span className="text-xs text-gray-400 font-normal">({deliverables.length})</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingDeliverables ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : deliverables.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">
                No deliverables yet
              </div>
            ) : (
              <div className="space-y-2">
                {deliverables.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-white"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{d.title}</span>
                        {d.aiExtracted && (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200 shrink-0">
                            <Sparkles className="h-3 w-3 mr-1" />
                            AI
                          </Badge>
                        )}
                      </div>
                      {d.description && (
                        <p className="text-sm text-gray-500 mt-1 truncate">{d.description}</p>
                      )}
                    </div>
                    {d.value !== null && (
                      <span className="font-medium text-gray-900 ml-4 shrink-0">
                        {formatCurrency(d.value)}
                      </span>
                    )}
                  </div>
                ))}
                {deliverables.some(d => d.value !== null) && (
                  <div className="flex justify-end pt-2 border-t">
                    <div className="text-sm">
                      <span className="text-gray-500 mr-2">Total:</span>
                      <span className="font-semibold">
                        {formatCurrency(deliverables.reduce((sum, d) => sum + (d.value ?? 0), 0))}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ListChecks className="h-4 w-4" />
              Tasks
              {tasks.length > 0 && (
                <span className="text-xs text-gray-400 font-normal">({tasks.length})</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingTasks ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">
                No tasks yet
              </div>
            ) : (
              <TaskTree
                tasks={tasks}
                projectId={project.id}
                onTasksChange={handleTaskUpdate}
              />
            )}
          </CardContent>
        </Card>

        {/* Costs Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Costs
              {costs.length > 0 && (
                <span className="text-xs text-gray-400 font-normal">({costs.length})</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {costs.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">
                No costs recorded yet
              </div>
            ) : (
              <div className="space-y-2">
                {costs.map((cost) => (
                  <div
                    key={cost.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-white text-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{cost.description}</span>
                        <Badge variant="outline" className={getCategoryColor(cost.category.name)}>
                          {cost.category.name}
                        </Badge>
                        {cost.aiImported && (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200 shrink-0">
                            <Sparkles className="h-3 w-3 mr-1" />
                            AI
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {formatDate(cost.date)}
                      </div>
                    </div>
                    <div className="font-medium text-gray-900 ml-4 shrink-0">
                      {formatCurrency(cost.amount)}
                    </div>
                  </div>
                ))}
                <div className="flex justify-end pt-2 border-t">
                  <div className="text-sm">
                    <span className="text-gray-500 mr-2">Total:</span>
                    <span className="font-semibold text-red-700">{formatCurrency(totalCosts)}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents
              {documents.length > 0 && (
                <span className="text-xs text-gray-400 font-normal">({documents.length})</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingDocuments ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <DocumentsSection
                projectId={project.id}
                documents={documents}
                onPreview={handlePreviewDocument}
                onDocumentsChange={handleDocumentsChange}
                onReview={handleReviewDocument}
                onReviewDeliverable={handleReviewDeliverables}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Image Preview Dialog */}
      {previewDocument && (
        <ImagePreviewDialog
          open={isPreviewOpen}
          onOpenChange={setIsPreviewOpen}
          document={previewDocument}
          projectId={project.id}
        />
      )}

      {/* AI Review Sheet */}
      {reviewDocument && reviewExtraction && (
        <AIReviewSheet
          open={isReviewSheetOpen}
          onOpenChange={setIsReviewSheetOpen}
          document={reviewDocument}
          extraction={reviewExtraction}
          projectId={project.id}
          categories={categories}
          onImportComplete={handleImportResult}
        />
      )}

      {/* Deliverable Review Sheet */}
      {reviewDeliverableDocument && reviewDeliverableExtraction && (
        <DeliverableReviewSheet
          open={isDeliverableReviewSheetOpen}
          onOpenChange={setIsDeliverableReviewSheetOpen}
          document={reviewDeliverableDocument}
          extraction={reviewDeliverableExtraction}
          projectId={project.id}
          onImportComplete={handleImportDeliverables}
        />
      )}
    </div>
  )
}
