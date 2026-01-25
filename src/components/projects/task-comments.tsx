'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Loader2, Send, Clock, MessageSquare } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

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

interface TaskCommentsProps {
  projectId: string
  taskId: string
}

export function TaskComments({ projectId, taskId }: TaskCommentsProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch comments on mount
  useEffect(() => {
    const fetchComments = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(
          `/api/projects/${projectId}/tasks/${taskId}/comments`
        )
        if (response.ok) {
          const data = await response.json()
          setComments(data)
        }
      } catch (error) {
        console.error('Failed to fetch comments:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchComments()
  }, [projectId, taskId])

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch(
        `/api/projects/${projectId}/tasks/${taskId}/comments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: newComment }),
        }
      )

      if (response.ok) {
        const comment = await response.json()
        setComments((prev) => [comment, ...prev])
        setNewComment('')
      }
    } catch (error) {
      console.error('Failed to add comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get user initials for avatar
  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase()
    }
    if (email) {
      return email.charAt(0).toUpperCase()
    }
    return '?'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Comments</span>
        {comments.length > 0 && (
          <span className="text-xs text-muted-foreground">
            ({comments.length})
          </span>
        )}
      </div>

      {/* New Comment Input */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <Avatar className="h-8 w-8 shrink-0">
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt={session?.user?.name || ''}
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <AvatarFallback className="text-xs bg-blue-600 text-white">
                {getInitials(session?.user?.name || null, session?.user?.email || null)}
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
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400 hidden sm:block">
            Cmd + Enter to submit
          </span>
          <Button
            size="sm"
            onClick={handleSubmitComment}
            disabled={!newComment.trim() || isSubmitting}
          >
            {isSubmitting ? (
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
      {isLoading ? (
        <div className="text-center py-4 text-gray-400 text-sm">
          <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
          Loading comments...
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-4 text-gray-400 text-sm">
          No comments yet
        </div>
      ) : (
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-gray-50 rounded-lg p-3 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar className="h-6 w-6 shrink-0">
                    {comment.user?.image ? (
                      <img
                        src={comment.user.image}
                        alt={comment.user.name || ''}
                        className="h-6 w-6 rounded-full"
                      />
                    ) : (
                      <AvatarFallback className="text-[10px] text-white font-medium bg-blue-600">
                        {getInitials(comment.user?.name, comment.user?.email)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span className="text-sm font-medium truncate">
                    {comment.user?.name || comment.user?.email || 'Unknown'}
                  </span>
                </div>
                <span className="text-xs text-gray-400 shrink-0 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(comment.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                {comment.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
