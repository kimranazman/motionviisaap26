'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { canEdit } from '@/lib/permissions'
import { PermissionDeniedDialog } from '@/components/permission-denied-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import {
  cn,
  formatDate,
  formatDepartment,
  formatTeamMember,
  getStatusColor,
  STATUS_OPTIONS,
  TEAM_MEMBER_OPTIONS,
} from '@/lib/utils'
import {
  Calendar,
  User,
  Building2,
  Target,
  Send,
  Loader2,
  MessageSquare,
  Clock,
  Trash2,
  BarChart3,
  RotateCcw,
} from 'lucide-react'
import { LinkedProjectsSection, type LinkedProject } from '@/components/objectives/linked-projects-section'
import { TimelineSuggestions } from '@/components/objectives/timeline-suggestions'

interface CommentUser {
  id: string
  name: string | null
  email: string | null
  image: string | null
}

interface Comment {
  id: string
  content: string
  user: CommentUser
  createdAt: string
}

interface Initiative {
  id: string
  sequenceNumber: number
  title: string
  keyResult: string
  department: string
  status: string
  personInCharge: string | null
  startDate: string
  endDate: string
  position: number
  // Optional fields loaded from API
  accountable?: string | null
  monthlyObjective?: string | null
  weeklyTasks?: string | null
  remarks?: string | null
  comments?: Comment[]
  // KPI fields
  kpiLabel?: string | null
  kpiTarget?: number | null
  kpiActual?: number | null
  kpiUnit?: string | null
  kpiManualOverride?: boolean
}

interface InitiativeDetailSheetProps {
  initiative: Initiative | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate?: (updated: Initiative) => void
  allInitiatives?: Array<{
    id: string
    personInCharge: string | null
    startDate: string | Date
    endDate: string | Date
    status: string
  }>
}

// Helper to get initials from name or email
const getInitials = (user: CommentUser): string => {
  if (user.name) {
    const parts = user.name.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return user.name.substring(0, 2).toUpperCase()
  }
  if (user.email) {
    return user.email.substring(0, 2).toUpperCase()
  }
  return '??'
}

export function InitiativeDetailSheet({
  initiative,
  open,
  onOpenChange,
  onUpdate,
  allInitiatives = [],
}: InitiativeDetailSheetProps) {
  const { data: session } = useSession()
  const userCanEdit = canEdit(session?.user?.role)
  const [showPermissionDenied, setShowPermissionDenied] = useState(false)
  const [status, setStatus] = useState(initiative?.status || '')
  const [personInCharge, setPersonInCharge] = useState(initiative?.personInCharge || '')
  const [comments, setComments] = useState<Comment[]>([])
  const [projects, setProjects] = useState<LinkedProject[]>([])
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

  // KPI state
  const [kpiLabel, setKpiLabel] = useState('')
  const [kpiTarget, setKpiTarget] = useState('')
  const [kpiActual, setKpiActual] = useState('')
  const [kpiUnit, setKpiUnit] = useState('')
  const [kpiManualOverride, setKpiManualOverride] = useState(false)
  const [showOverrideConfirm, setShowOverrideConfirm] = useState(false)
  const [pendingActual, setPendingActual] = useState('')
  // Track loaded KPI values for hasChanges detection
  const [loadedKpi, setLoadedKpi] = useState({
    label: '', target: '', actual: '', unit: '', manualOverride: false,
  })

  // Load full initiative data with comments when opened
  useEffect(() => {
    if (open && initiative?.id) {
      setIsLoading(true)
      fetch(`/api/initiatives/${initiative.id}`)
        .then(res => res.json())
        .then(data => {
          setStatus(data.status)
          setPersonInCharge(data.personInCharge || '')
          setComments(data.comments || [])
          setProjects(data.projects || [])
          // Initialize KPI state from fetched data
          const label = data.kpiLabel || ''
          const target = data.kpiTarget != null ? String(data.kpiTarget) : ''
          const actual = data.kpiActual != null ? String(data.kpiActual) : ''
          const unit = data.kpiUnit || ''
          const override = data.kpiManualOverride || false
          setKpiLabel(label)
          setKpiTarget(target)
          setKpiActual(actual)
          setKpiUnit(unit)
          setKpiManualOverride(override)
          setLoadedKpi({ label, target, actual, unit, manualOverride: override })
        })
        .catch(console.error)
        .finally(() => setIsLoading(false))
    }
  }, [open, initiative?.id])

  // Save status/person changes
  const handleSave = async () => {
    if (!initiative) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/initiatives/${initiative.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          personInCharge: personInCharge || null,
          kpiLabel: kpiLabel || null,
          kpiTarget: kpiTarget !== '' ? parseFloat(kpiTarget) : null,
          kpiActual: kpiActual !== '' ? parseFloat(kpiActual) : null,
          kpiUnit: kpiUnit || null,
          kpiManualOverride,
        }),
      })

      if (response.status === 403) {
        setShowPermissionDenied(true)
        return
      }

      if (response.ok) {
        const updated = await response.json()
        onUpdate?.({ ...initiative, ...updated })
      }
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Submit new comment
  const handleSubmitComment = async () => {
    if (!initiative || !newComment.trim()) return

    setIsSubmittingComment(true)
    try {
      const response = await fetch(`/api/initiatives/${initiative.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment,
        }),
      })

      if (response.status === 403) {
        setShowPermissionDenied(true)
        return
      }

      if (response.ok) {
        const comment = await response.json()
        setComments(prev => [comment, ...prev])
        setNewComment('')
      }
    } catch (error) {
      console.error('Failed to add comment:', error)
    } finally {
      setIsSubmittingComment(false)
    }
  }

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    if (!initiative) return

    try {
      const response = await fetch(
        `/api/initiatives/${initiative.id}/comments?commentId=${commentId}`,
        { method: 'DELETE' }
      )

      if (response.status === 403) {
        setShowPermissionDenied(true)
        return
      }

      if (response.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId))
      }
    } catch (error) {
      console.error('Failed to delete comment:', error)
    }
  }

  const formatCommentTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-MY', { month: 'short', day: 'numeric' })
  }

  // Handle KPI actual change -- triggers override confirm if not already overriding
  const handleKpiActualChange = (value: string) => {
    if (!kpiManualOverride && value !== '' && value !== kpiActual) {
      setPendingActual(value)
      setShowOverrideConfirm(true)
    } else {
      setKpiActual(value)
    }
  }

  const handleConfirmOverride = () => {
    setKpiActual(pendingActual)
    setKpiManualOverride(true)
    setShowOverrideConfirm(false)
  }

  const handleCancelOverride = () => {
    setPendingActual('')
    setShowOverrideConfirm(false)
  }

  // Revert to auto-calculation
  const handleRevertToAuto = async () => {
    if (!initiative) return
    try {
      await fetch(`/api/initiatives/${initiative.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kpiManualOverride: false,
          kpiActual: null,
        }),
      })
      setKpiManualOverride(false)
      setKpiActual('')
      setLoadedKpi(prev => ({ ...prev, actual: '', manualOverride: false }))
      onUpdate?.({ ...initiative, kpiManualOverride: false, kpiActual: null })
    } catch (error) {
      console.error('Failed to revert to auto:', error)
    }
  }

  if (!initiative) return null

  const hasChanges = status !== initiative.status ||
    (personInCharge || null) !== (initiative.personInCharge || null) ||
    kpiLabel !== loadedKpi.label ||
    kpiTarget !== loadedKpi.target ||
    kpiActual !== loadedKpi.actual ||
    kpiUnit !== loadedKpi.unit ||
    kpiManualOverride !== loadedKpi.manualOverride

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="md:max-w-[650px] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b shrink-0 pr-12">
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="shrink-0 mt-1">
              {initiative.keyResult}
            </Badge>
            <DialogTitle className="text-left text-lg leading-snug">
              {initiative.title}
            </DialogTitle>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6 space-y-6">
            {/* Quick Info Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Status - Editable only for Editor/Admin */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5" />
                  Status
                </label>
                {userCanEdit ? (
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <span className={cn('px-2 py-0.5 rounded text-xs', getStatusColor(opt.value))}>
                            {opt.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="h-9 px-3 flex items-center text-sm bg-gray-50 rounded-md border">
                    <span className={cn('px-2 py-0.5 rounded text-xs', getStatusColor(initiative.status))}>
                      {STATUS_OPTIONS.find(o => o.value === initiative.status)?.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Person In Charge - Editable only for Editor/Admin */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  Person In Charge
                </label>
                {userCanEdit ? (
                  <Select
                    value={personInCharge || '__unassigned__'}
                    onValueChange={(val) =>
                      setPersonInCharge(val === '__unassigned__' ? '' : val)
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__unassigned__">Unassigned</SelectItem>
                      {TEAM_MEMBER_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="h-9 px-3 flex items-center text-sm bg-gray-50 rounded-md border">
                    {initiative.personInCharge ? formatTeamMember(initiative.personInCharge) : 'Unassigned'}
                  </div>
                )}
              </div>

              {/* Department */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  Department
                </label>
                <div className="h-9 px-3 flex items-center text-sm bg-gray-50 rounded-md border">
                  {formatDepartment(initiative.department)}
                </div>
              </div>

              {/* Due Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Due Date
                </label>
                <div className="h-9 px-3 flex items-center text-sm bg-gray-50 rounded-md border">
                  {formatDate(initiative.endDate)}
                </div>
              </div>
            </div>

            {/* Timeline Suggestions */}
            {allInitiatives.length > 0 && initiative && (
              <TimelineSuggestions
                startDate={initiative.startDate}
                endDate={initiative.endDate}
                status={status}
                allInitiatives={allInitiatives}
                currentInitiativeId={initiative.id}
              />
            )}

            {/* KPI Tracking Section */}
            <Separator />
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                KPI Tracking
              </h3>

              {kpiManualOverride && (
                <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                  <span className="text-xs text-yellow-700">Manual override active</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-yellow-700 hover:text-yellow-900"
                    onClick={handleRevertToAuto}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Revert to Auto
                  </Button>
                </div>
              )}

              {userCanEdit ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500">KPI Label</label>
                    <Input
                      value={kpiLabel}
                      onChange={e => setKpiLabel(e.target.value)}
                      placeholder="e.g., Revenue, Completion"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500">Unit</label>
                    <Input
                      value={kpiUnit}
                      onChange={e => setKpiUnit(e.target.value)}
                      placeholder="e.g., RM, %, units"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500">Target</label>
                    <Input
                      type="number"
                      value={kpiTarget}
                      onChange={e => setKpiTarget(e.target.value)}
                      placeholder="Target value"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500">Actual</label>
                    <Input
                      type="number"
                      value={kpiManualOverride ? kpiActual : kpiActual}
                      onChange={e => handleKpiActualChange(e.target.value)}
                      placeholder="Actual value"
                      className="h-9"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-xs text-gray-500">Label:</span>
                    <span className="ml-1">{kpiLabel || '-'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Unit:</span>
                    <span className="ml-1">{kpiUnit || '-'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Target:</span>
                    <span className="ml-1">{kpiTarget || '-'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Actual:</span>
                    <span className="ml-1">{kpiActual || '-'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Save Button */}
            {hasChanges && (
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full"
              >
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            )}

            <Separator />

            {/* Linked Projects Section */}
            <LinkedProjectsSection projects={projects} />

            <Separator />

            {/* Comments Section */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Comments
                {comments.length > 0 && (
                  <span className="text-xs text-gray-400">({comments.length})</span>
                )}
              </h3>

              {/* New Comment Input */}
              <div className="space-y-2">
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    {session?.user?.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name || 'User'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <AvatarFallback className="text-xs bg-blue-600 text-white">
                        {session?.user?.name?.substring(0, 2).toUpperCase() || '??'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <Textarea
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      className="min-h-[80px]"
                      onKeyDown={e => {
                        if (e.key === 'Enter' && e.metaKey) {
                          handleSubmitComment()
                        }
                      }}
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">⌘ + Enter to submit</span>
                      <Button
                        size="sm"
                        onClick={handleSubmitComment}
                        disabled={!newComment.trim() || isSubmittingComment}
                      >
                        {isSubmittingComment ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-1" />
                            Send
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comments List */}
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No comments yet. Be the first to comment!
                </div>
              ) : (
                <div className="space-y-3">
                  {comments.map(comment => (
                    <div
                      key={comment.id}
                      className="group bg-gray-50 rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            {comment.user.image ? (
                              <img
                                src={comment.user.image}
                                alt={comment.user.name || 'User'}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <AvatarFallback className="text-[10px] text-white font-medium bg-blue-600">
                                {getInitials(comment.user)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <span className="text-sm font-medium">
                            {comment.user.name || comment.user.email || 'Unknown'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatCommentTime(comment.createdAt)}
                          </span>
                          {userCanEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleDeleteComment(comment.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>

      <PermissionDeniedDialog
        open={showPermissionDenied}
        onOpenChange={setShowPermissionDenied}
      />

      <AlertDialog open={showOverrideConfirm} onOpenChange={setShowOverrideConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Override auto-calculated value?</AlertDialogTitle>
            <AlertDialogDescription>
              This will set the KPI actual value manually and stop auto-calculation
              from linked project revenue. You can revert to auto-calculation later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelOverride}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmOverride}>
              Override
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
