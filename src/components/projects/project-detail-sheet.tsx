'use client'

import { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Loader2, Trash2, ArrowRight, Plus, Target, DollarSign, CalendarIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { CompanySelect } from '@/components/pipeline/company-select'
import { ContactSelect } from '@/components/pipeline/contact-select'
import { InitiativeSelect } from './initiative-select'
import { CostForm } from './cost-form'
import { CostCard } from './cost-card'
import { DocumentsSection } from './documents-section'
import { ImagePreviewDialog } from './image-preview-dialog'
import { AIReviewSheet } from '@/components/ai/ai-review-sheet'
import { type DocumentCategory, type DocumentAIStatus } from '@/lib/document-utils'
import { toast } from 'sonner'
import { InvoiceExtraction, ReceiptExtraction, AIAnalysisResult } from '@/types/ai-extraction'
import { calculateTotalCosts, calculateProfit } from '@/lib/cost-utils'
import { Card } from '@/components/ui/card'
import {
  PROJECT_STATUSES,
  getProjectStatusColor,
  formatProjectStatus,
} from '@/lib/project-utils'
import { cn, formatCurrency } from '@/lib/utils'
import { DatePickerCalendar } from '@/components/ui/date-picker-with-presets'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'

interface Contact {
  id: string
  name: string
}

interface CostCategory {
  id: string
  name: string
  description: string | null
}

interface Cost {
  id: string
  description: string
  amount: number
  date: string
  categoryId: string
  category: { id: string; name: string }
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
  status: string
  startDate: string | null
  endDate: string | null
  company: { id: string; name: string } | null
  contact: { id: string; name: string } | null
  initiative: { id: string; title: string } | null
  sourceDeal: { id: string; title: string; stageChangedAt?: string } | null
  sourcePotential: { id: string; title: string } | null
  costs?: Cost[]
}

interface ProjectDetailSheetProps {
  project: Project | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (project: Project) => void
  onDelete: (projectId: string) => void
}

// Financials Summary sub-component
interface FinancialsSummaryProps {
  revenue: number | null
  totalCosts: number
  profit: number
  costsCount: number
}

function FinancialsSummary({ revenue, totalCosts, profit, costsCount }: FinancialsSummaryProps) {
  const revenueValue = revenue ?? 0
  const hasNoData = revenueValue === 0 && totalCosts === 0

  // Calculate margin percentage
  const margin = revenueValue > 0
    ? Math.round(((revenueValue - totalCosts) / revenueValue) * 100)
    : 0

  // Determine profit/loss status
  const isProfitable = profit > 0
  const isBreakEven = profit === 0
  const isLoss = profit < 0

  // Get icon based on profit status
  const ProfitIcon = isProfitable ? TrendingUp : isLoss ? TrendingDown : Minus

  if (hasNoData) {
    return (
      <div className="space-y-3">
        <Label className="text-muted-foreground">Financials Summary</Label>
        <Card className="p-6 text-center border-dashed">
          <DollarSign className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">No financial data yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Import invoices and receipts to see summary
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Label className="text-muted-foreground">Financials Summary</Label>

      {/* Revenue and Costs cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3 bg-green-50 border-green-200">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <div className="text-xs text-green-600 font-medium">Revenue</div>
          </div>
          <div className="text-lg font-semibold text-green-700 mt-1">
            {formatCurrency(revenueValue)}
          </div>
          <div className="text-xs text-green-600/70 mt-0.5">
            {revenueValue > 0 ? 'From invoices' : 'No invoices yet'}
          </div>
        </Card>

        <Card className="p-3 bg-red-50 border-red-200">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-600" />
            <div className="text-xs text-red-600 font-medium">Total Costs</div>
          </div>
          <div className="text-lg font-semibold text-red-700 mt-1">
            {formatCurrency(totalCosts)}
          </div>
          <div className="text-xs text-red-600/70 mt-0.5">
            From {costsCount} expense{costsCount !== 1 ? 's' : ''}
          </div>
        </Card>
      </div>

      {/* Profit/Loss card - full width */}
      <Card className={cn(
        'p-3',
        isProfitable && 'bg-green-100 border-green-200',
        isLoss && 'bg-red-100 border-red-200',
        isBreakEven && 'bg-gray-100 border-gray-200'
      )}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ProfitIcon className={cn(
                'h-4 w-4',
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
              'text-xl font-bold mt-1',
              isProfitable && 'text-green-800',
              isLoss && 'text-red-800',
              isBreakEven && 'text-gray-700'
            )}>
              {formatCurrency(Math.abs(profit))}
            </div>
          </div>
          {revenueValue > 0 && (
            <div className={cn(
              'text-right',
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
  )
}

export function ProjectDetailSheet({
  project,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
}: ProjectDetailSheetProps) {
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState('')
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [contactId, setContactId] = useState<string | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [initiativeId, setInitiativeId] = useState<string | null>(null)
  const [revenue, setRevenue] = useState('')
  const [description, setDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoadingContacts, setIsLoadingContacts] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [costs, setCosts] = useState<Cost[]>([])
  const [categories, setCategories] = useState<CostCategory[]>([])
  const [showAddCostForm, setShowAddCostForm] = useState(false)
  const [editingCost, setEditingCost] = useState<Cost | null>(null)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  // AI Review state
  const [reviewDocument, setReviewDocument] = useState<Document | null>(null)
  const [reviewExtraction, setReviewExtraction] = useState<InvoiceExtraction | ReceiptExtraction | null>(null)
  const [isReviewSheetOpen, setIsReviewSheetOpen] = useState(false)

  // Fetch cost categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/cost-categories')
        if (response.ok) {
          const data = await response.json()
          setCategories(data)
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      }
    }
    fetchCategories()
  }, [])

  // Initialize form when project changes
  useEffect(() => {
    if (project && open) {
      setTitle(project.title)
      setStatus(project.status)
      setCompanyId(project.company?.id || null)
      setContactId(project.contact?.id || null)
      setInitiativeId(project.initiative?.id || null)
      setRevenue(project.revenue?.toString() || '')
      setDescription(project.description || '')
      setError(null)
      setCosts(project.costs || [])
      setShowAddCostForm(false)
      setEditingCost(null)

      // Initialize dates
      if (project.startDate) {
        setStartDate(new Date(project.startDate))
      } else if (project.sourceDeal?.stageChangedAt) {
        // Auto-fill from deal won date if available
        setStartDate(new Date(project.sourceDeal.stageChangedAt))
      } else {
        setStartDate(null)
      }
      setEndDate(project.endDate ? new Date(project.endDate) : null)

      // Reset document state
      setDocuments([])
      setPreviewDocument(null)
      setIsPreviewOpen(false)

      // Reset review state
      setReviewDocument(null)
      setReviewExtraction(null)
      setIsReviewSheetOpen(false)

      // Fetch contacts for selected company
      if (project.company?.id) {
        fetchContacts(project.company.id)
      }
    }
  }, [project, open])

  // Fetch documents when project changes
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!project || !open) return
      try {
        const response = await fetch(`/api/projects/${project.id}/documents`)
        if (response.ok) {
          const data = await response.json()
          setDocuments(data)
        }
      } catch (error) {
        console.error('Failed to fetch documents:', error)
      }
    }
    fetchDocuments()
  }, [project?.id, open])

  const fetchContacts = async (compId: string) => {
    setIsLoadingContacts(true)
    try {
      const response = await fetch(`/api/companies/${compId}`)
      if (response.ok) {
        const data = await response.json()
        setContacts(data.contacts || [])
      }
    } catch (error) {
      console.error('Failed to fetch contacts:', error)
      setContacts([])
    } finally {
      setIsLoadingContacts(false)
    }
  }

  // Handle company change
  const handleCompanyChange = (newCompanyId: string | null) => {
    setCompanyId(newCompanyId)
    setContactId(null) // Clear contact when company changes
    if (newCompanyId) {
      fetchContacts(newCompanyId)
    } else {
      setContacts([])
    }
  }

  const handleSave = async () => {
    if (!project) return
    setError(null)

    // Validate required fields
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    if (!companyId) {
      setError('Company is required')
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          status,
          companyId,
          contactId: contactId || null,
          initiativeId: initiativeId || null,
          revenue: revenue ? parseFloat(revenue) : null,
          description: description.trim() || null,
          startDate: startDate ? startDate.toISOString() : null,
          endDate: endDate ? endDate.toISOString() : null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to update project')
        return
      }

      const updatedProject = await response.json()
      onUpdate(updatedProject)
      onOpenChange(false)
    } catch (err) {
      console.error('Failed to update project:', err)
      setError('Failed to update project')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!project) return

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to delete project')
        return
      }

      onDelete(project.id)
      onOpenChange(false)
    } catch (err) {
      console.error('Failed to delete project:', err)
      setError('Failed to delete project')
    } finally {
      setIsDeleting(false)
    }
  }

  // Cost management handlers
  const handleCostAdded = async () => {
    if (!project) return
    try {
      const response = await fetch(`/api/projects/${project.id}/costs`)
      if (response.ok) {
        const data = await response.json()
        setCosts(data)
      }
    } catch (error) {
      console.error('Failed to refresh costs:', error)
    }
    setShowAddCostForm(false)
    setEditingCost(null)
  }

  const handleCostDeleted = async () => {
    if (!project) return
    try {
      const response = await fetch(`/api/projects/${project.id}/costs`)
      if (response.ok) {
        const data = await response.json()
        setCosts(data)
      }
    } catch (error) {
      console.error('Failed to refresh costs:', error)
    }
  }

  const handleEditCost = (cost: Cost) => {
    setEditingCost(cost)
    setShowAddCostForm(true)
  }

  const handleCancelCostForm = () => {
    setShowAddCostForm(false)
    setEditingCost(null)
  }

  // Document management handlers
  const handleDocumentsRefresh = async () => {
    if (!project) return
    try {
      const response = await fetch(`/api/projects/${project.id}/documents`)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data)
      }
    } catch (error) {
      console.error('Failed to refresh documents:', error)
    }
  }

  const handlePreviewDocument = (doc: Document) => {
    setPreviewDocument(doc)
    setIsPreviewOpen(true)
  }

  // AI Review handler - load AI results and open review sheet
  const handleReviewDocument = async (doc: Document) => {
    if (!project) return

    try {
      const response = await fetch(`/api/projects/${project.id}/ai-results`)
      if (!response.ok) {
        const data = await response.json()
        toast.error('Failed to load AI results', {
          description: data.message || data.error || 'Unknown error',
        })
        return
      }

      const results: AIAnalysisResult = await response.json()

      // Find extraction matching the document
      let extraction: InvoiceExtraction | ReceiptExtraction | null = null

      if (doc.category === 'INVOICE') {
        extraction = results.invoices.find((inv) => inv.documentId === doc.id) || null
      } else if (doc.category === 'RECEIPT') {
        extraction = results.receipts.find((rec) => rec.documentId === doc.id) || null
      }

      if (!extraction) {
        toast.error('AI extraction not found', {
          description: 'No AI analysis data found for this document',
        })
        return
      }

      setReviewDocument(doc)
      setReviewExtraction(extraction)
      setIsReviewSheetOpen(true)
    } catch (error) {
      console.error('Failed to load AI results:', error)
      toast.error('Failed to load AI results')
    }
  }

  // Handle import complete - refresh documents and costs
  const handleImportComplete = async () => {
    // Refresh documents to update AI status
    await handleDocumentsRefresh()
    // Refresh costs (for receipt imports)
    if (project) {
      try {
        const response = await fetch(`/api/projects/${project.id}/costs`)
        if (response.ok) {
          const data = await response.json()
          setCosts(data)
        }
      } catch (error) {
        console.error('Failed to refresh costs:', error)
      }
    }
  }

  if (!project) return null

  // Calculate financial totals
  const totalCosts = calculateTotalCosts(costs)
  const profit = calculateProfit(project.revenue, totalCosts)

  // Helper to compare dates (only date portion)
  const formatDateForCompare = (d: Date | null) => d?.toISOString().split('T')[0] || null
  const projectStartDateForCompare = project.startDate
    ? new Date(project.startDate).toISOString().split('T')[0]
    : project.sourceDeal?.stageChangedAt
      ? new Date(project.sourceDeal.stageChangedAt).toISOString().split('T')[0]
      : null
  const projectEndDateForCompare = project.endDate
    ? new Date(project.endDate).toISOString().split('T')[0]
    : null

  const hasChanges =
    title !== project.title ||
    status !== project.status ||
    companyId !== (project.company?.id || null) ||
    contactId !== (project.contact?.id || null) ||
    initiativeId !== (project.initiative?.id || null) ||
    revenue !== (project.revenue?.toString() || '') ||
    description !== (project.description || '') ||
    formatDateForCompare(startDate) !== projectStartDateForCompare ||
    formatDateForCompare(endDate) !== projectEndDateForCompare

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-full sm:max-w-lg p-0 flex flex-col"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => e.preventDefault()}
      >
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <Badge className={cn('shrink-0', getProjectStatusColor(project.status))}>
              {formatProjectStatus(project.status)}
            </Badge>
            <SheetTitle className="text-left text-lg leading-snug truncate">
              {project.title}
            </SheetTitle>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="edit-title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter project title"
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_STATUSES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex items-center gap-2">
                        <div className={cn('w-2 h-2 rounded-full', s.colorDot)} />
                        {s.title}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Company */}
            <div className="space-y-2">
              <Label>
                Company <span className="text-red-500">*</span>
              </Label>
              <CompanySelect
                value={companyId}
                onValueChange={handleCompanyChange}
              />
            </div>

            {/* Contact */}
            <div className="space-y-2">
              <Label>Contact</Label>
              <ContactSelect
                value={contactId}
                onValueChange={setContactId}
                contacts={contacts}
                disabled={!companyId || isLoadingContacts}
              />
              {isLoadingContacts && (
                <p className="text-xs text-muted-foreground">
                  Loading contacts...
                </p>
              )}
            </div>

            {/* Revenue */}
            <div className="space-y-2">
              <Label htmlFor="edit-revenue">Revenue</Label>
              <Input
                id="edit-revenue"
                type="number"
                step="0.01"
                min="0"
                value={revenue}
                onChange={(e) => setRevenue(e.target.value)}
                placeholder="0.00"
              />
            </div>

            {/* KRI Link */}
            <div className="space-y-2">
              <Label>Link to KRI</Label>
              <InitiativeSelect
                value={initiativeId}
                onValueChange={setInitiativeId}
                initialInitiative={project.initiative}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add notes about this project..."
                className="min-h-[80px]"
              />
            </div>

            {/* Project Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal h-11',
                        !startDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, 'PP') : 'Pick date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <DatePickerCalendar
                      selected={startDate || undefined}
                      onSelect={(d) => setStartDate(d || null)}
                      fromYear={2020}
                      toYear={2035}
                    />
                  </PopoverContent>
                </Popover>
                {project.sourceDeal?.stageChangedAt && !project.startDate && (
                  <p className="text-xs text-muted-foreground">
                    Auto-filled from deal won date
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal h-11',
                        !endDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'PP') : 'Pick date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <DatePickerCalendar
                      selected={endDate || undefined}
                      onSelect={(d) => setEndDate(d || null)}
                      fromYear={2020}
                      toYear={2035}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <Separator />

            {/* Source Info */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Source</Label>
              {project.sourceDeal ? (
                <div className="flex items-center gap-2 text-sm">
                  <ArrowRight className="h-4 w-4 text-green-500" />
                  <span>Converted from deal: </span>
                  <span className="font-medium">{project.sourceDeal.title}</span>
                </div>
              ) : project.sourcePotential ? (
                <div className="flex items-center gap-2 text-sm">
                  <ArrowRight className="h-4 w-4 text-blue-500" />
                  <span>Converted from potential: </span>
                  <span className="font-medium">{project.sourcePotential.title}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Plus className="h-4 w-4" />
                  <span>Created directly</span>
                </div>
              )}
            </div>

            {/* KRI Display */}
            {project.initiative && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Linked KRI</Label>
                <div className="flex items-center gap-2 text-sm">
                  <Target className="h-4 w-4 text-purple-500" />
                  <span className="font-medium">{project.initiative.title}</span>
                </div>
              </div>
            )}

            <Separator />

            {/* Financials Summary */}
            <FinancialsSummary
              revenue={project.revenue}
              totalCosts={totalCosts}
              profit={profit}
              costsCount={costs.length}
            />

            <Separator />

            {/* Costs Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-muted-foreground">Costs</Label>
                  {costs.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {costs.length}
                    </Badge>
                  )}
                </div>
                {costs.length > 0 && !showAddCostForm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddCostForm(true)}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Add Cost
                  </Button>
                )}
              </div>

              {/* Cost Form */}
              {showAddCostForm && (
                <CostForm
                  projectId={project.id}
                  cost={editingCost || undefined}
                  categories={categories}
                  onSuccess={handleCostAdded}
                  onCancel={handleCancelCostForm}
                />
              )}

              {/* Cost List or Empty State */}
              {costs.length === 0 && !showAddCostForm ? (
                <Card className="p-6 text-center">
                  <DollarSign className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 mb-3">No costs recorded yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddCostForm(true)}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Add your first cost
                  </Button>
                </Card>
              ) : (
                <div className="space-y-2">
                  {costs.map((cost) => (
                    <CostCard
                      key={cost.id}
                      cost={cost}
                      projectId={project.id}
                      onEdit={handleEditCost}
                      onDelete={handleCostDeleted}
                    />
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Documents Section */}
            <DocumentsSection
              projectId={project.id}
              documents={documents}
              onPreview={handlePreviewDocument}
              onDocumentsChange={handleDocumentsRefresh}
              onReview={handleReviewDocument}
            />

            {/* Error message */}
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>
        </ScrollArea>

        {/* Image Preview Dialog */}
        <ImagePreviewDialog
          document={previewDocument}
          projectId={project.id}
          open={isPreviewOpen}
          onOpenChange={setIsPreviewOpen}
        />

        {/* AI Review Sheet */}
        {reviewDocument && reviewExtraction && (
          <AIReviewSheet
            open={isReviewSheetOpen}
            onOpenChange={setIsReviewSheetOpen}
            projectId={project.id}
            document={reviewDocument}
            extraction={reviewExtraction}
            categories={categories}
            onImportComplete={handleImportComplete}
          />
        )}

        <SheetFooter className="p-4 border-t flex-col sm:flex-row gap-2 sm:gap-0 justify-between sm:justify-between">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full sm:w-auto"
                disabled={isDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Project</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete &quot;{project.title}&quot;? This
                  action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Project'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="w-full sm:w-auto"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
