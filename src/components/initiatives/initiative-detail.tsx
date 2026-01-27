'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { canEdit } from '@/lib/permissions'
import { PermissionDeniedDialog } from '@/components/permission-denied-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  ArrowLeft,
  Calendar,
  User,
  Building2,
  Target,
  Send,
  Loader2,
  MessageSquare,
  Clock,
  Trash2,
  FileText,
} from 'lucide-react'

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
  objective: string
  keyResultId?: string | null
  keyResult?: { id: string; krId: string; description: string } | null
  department: string
  status: string
  personInCharge: string | null
  accountable: string | null
  budget?: string | null
  resources?: string | null
  startDate: string
  endDate: string
  resourcesFinancial: number | null
  resourcesNonFinancial: string | null
  remarks: string | null
  position: number
  createdAt: string
  updatedAt: string
  comments: Comment[]
}

interface InitiativeDetailProps {
  initiative: Initiative
}

export function InitiativeDetail({ initiative }: InitiativeDetailProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const userCanEdit = canEdit(session?.user?.role)
  const [showPermissionDenied, setShowPermissionDenied] = useState(false)

  // Editable fields state
  const [status, setStatus] = useState(initiative.status)
  const [personInCharge, setPersonInCharge] = useState(
    initiative.personInCharge || ''
  )
  const [remarks, setRemarks] = useState(initiative.remarks || '')

  // Track initial values for change detection
  const [initialValues] = useState({
    status: initiative.status,
    personInCharge: initiative.personInCharge || '',
    remarks: initiative.remarks || '',
  })

  // Comments state
  const [comments, setComments] = useState<Comment[]>(initiative.comments)
  const [newComment, setNewComment] = useState('')

  // Loading states
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

  // Check if there are unsaved changes
  const hasChanges =
    status !== initialValues.status ||
    personInCharge !== initialValues.personInCharge ||
    remarks !== initialValues.remarks

  // Save changes handler
  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/initiatives/${initiative.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          personInCharge: personInCharge || null,
          remarks: remarks || null,
        }),
      })

      if (response.status === 403) {
        setShowPermissionDenied(true)
        return
      }

      if (response.ok) {
        // Refresh the page to get updated data
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Submit new comment
  const handleSubmitComment = async () => {
    if (!newComment.trim()) return

    setIsSubmittingComment(true)
    try {
      const response = await fetch(
        `/api/initiatives/${initiative.id}/comments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: newComment,
          }),
        }
      )

      if (response.status === 403) {
        setShowPermissionDenied(true)
        return
      }

      if (response.ok) {
        const comment = await response.json()
        setComments((prev) => [comment, ...prev])
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
        setComments((prev) => prev.filter((c) => c.id !== commentId))
      }
    } catch (error) {
      console.error('Failed to delete comment:', error)
    }
  }

  // Format comment time for relative display
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

  // Handle back navigation
  const handleBack = () => {
    router.back()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center gap-3 md:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="shrink-0">
                  #{initiative.sequenceNumber}
                </Badge>
                <Badge variant="outline" className="shrink-0">
                  {initiative.keyResult?.krId || 'Unlinked'}
                </Badge>
              </div>
              <h1 className="text-xl font-semibold text-gray-900 truncate">
                {initiative.title}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
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
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded text-xs',
                              getStatusColor(opt.value)
                            )}
                          >
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
                      {TEAM_MEMBER_OPTIONS.map((opt) => (
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

              {/* Department - Read Only */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  Department
                </label>
                <div className="h-9 px-3 flex items-center text-sm bg-gray-50 rounded-md border">
                  {formatDepartment(initiative.department)}
                </div>
              </div>

              {/* Key Result - Read Only */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5" />
                  Key Result
                </label>
                <div className="h-9 px-3 flex items-center text-sm bg-gray-50 rounded-md border">
                  {initiative.keyResult
                    ? `${initiative.keyResult.krId} - ${initiative.keyResult.description}`
                    : 'Unlinked'}
                </div>
              </div>

              {/* Budget - Read Only */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5" />
                  Budget
                </label>
                <div className="h-9 px-3 flex items-center text-sm bg-gray-50 rounded-md border">
                  {initiative.budget || '-'}
                </div>
              </div>

              {/* Resources - Read Only */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5" />
                  Resources
                </label>
                <div className="h-9 px-3 flex items-center text-sm bg-gray-50 rounded-md border">
                  {initiative.resources || '-'}
                </div>
              </div>

              {/* Start Date - Read Only */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Start Date
                </label>
                <div className="h-9 px-3 flex items-center text-sm bg-gray-50 rounded-md border">
                  {formatDate(initiative.startDate)}
                </div>
              </div>

              {/* End Date - Read Only */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  End Date
                </label>
                <div className="h-9 px-3 flex items-center text-sm bg-gray-50 rounded-md border">
                  {formatDate(initiative.endDate)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Remarks Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Remarks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userCanEdit ? (
              <Textarea
                placeholder="Add remarks or notes about this initiative..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="min-h-[100px]"
              />
            ) : (
              <div className="text-sm text-gray-700 min-h-[100px] p-3 bg-gray-50 rounded-md border">
                {remarks || <span className="text-gray-400">No remarks</span>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Button - Only visible when changes exist */}
        {hasChanges && (
          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        )}

        <Separator />

        {/* Comments Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comments
              {comments.length > 0 && (
                <span className="text-xs text-gray-400 font-normal">
                  ({comments.length})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* New Comment Input */}
            <div className="space-y-2">
              <div className="flex gap-2 md:gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  {session?.user?.image ? (
                    <img src={session.user.image} alt={session?.user?.name || ''} className="h-8 w-8 rounded-full" />
                  ) : (
                    <AvatarFallback className="text-xs bg-blue-600 text-white">
                      {session?.user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                    </AvatarFallback>
                  )}
                </Avatar>
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[80px] flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.metaKey) {
                      handleSubmitComment()
                    }
                  }}
                />
              </div>
              <div className="flex justify-between items-center flex-wrap gap-2">
                <span className="text-xs text-gray-400 hidden sm:block">Cmd + Enter to submit</span>
                <Button
                  size="sm"
                  className="w-full sm:w-auto"
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

            {/* Comments List */}
            {comments.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                No comments yet. Be the first to comment!
              </div>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="group bg-gray-50 rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="h-6 w-6 shrink-0">
                          {comment.user?.image ? (
                            <img src={comment.user.image} alt={comment.user.name || ''} className="h-6 w-6 rounded-full" />
                          ) : (
                            <AvatarFallback className="text-[10px] text-white font-medium bg-blue-600">
                              {comment.user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <span className="text-sm font-medium truncate">
                          {comment.user?.name || comment.user?.email || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 shrink-0 flex items-center gap-1">
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
                    <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                      {comment.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <PermissionDeniedDialog
        open={showPermissionDenied}
        onOpenChange={setShowPermissionDenied}
      />
    </div>
  )
}
