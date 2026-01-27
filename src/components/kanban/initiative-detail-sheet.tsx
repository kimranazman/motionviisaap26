'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { canEdit } from '@/lib/permissions'
import { PermissionDeniedDialog } from '@/components/permission-denied-dialog'
import { DetailView } from '@/components/ui/detail-view'
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
  Calendar,
  User,
  Building2,
  Target,
  Send,
  Loader2,
  MessageSquare,
  Clock,
  Trash2,
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
  objective?: string
  keyResultId?: string | null
  keyResult: string | { krId: string } | null | undefined
  department: string
  status: string
  personInCharge: string | null
  startDate: string
  endDate: string
  position: number
  budget?: string | null
  // Optional fields loaded from API or passed by hierarchy view
  accountable?: string | null
  remarks?: string | null
  comments?: Comment[]
  projects?: Array<{
    id: string
    title: string
    status: string
    revenue: number | null
    totalCosts: number
    companyName: string | null
    startDate: string | null
    endDate: string | null
  }>
}

interface InitiativeDetailSheetProps {
  initiative: Initiative | null
  open: boolean
  onOpenChange: (open: boolean) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdate?: (updated: any) => void
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

  if (!initiative) return null

  const hasChanges = status !== initiative.status ||
    (personInCharge || null) !== (initiative.personInCharge || null)

  return (
    <>
    <DetailView
      open={open}
      onOpenChange={onOpenChange}
      title={
        <div className="flex items-start gap-3">
          <Badge variant="outline" className="shrink-0 mt-1">
            {typeof initiative.keyResult === 'string'
              ? initiative.keyResult
              : initiative.keyResult?.krId || 'Unlinked'}
          </Badge>
          <span>{initiative.title}</span>
        </div>
      }
      expandHref={`/initiatives/${initiative.id}`}
      className="md:max-w-[650px]"
    >
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
                      <span className="text-xs text-gray-400">Cmd + Enter to submit</span>
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
    </DetailView>

    <PermissionDeniedDialog
      open={showPermissionDenied}
      onOpenChange={setShowPermissionDenied}
    />
    </>
  )
}
