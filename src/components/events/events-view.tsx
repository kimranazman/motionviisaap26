'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { cn } from '@/lib/utils'
import { Calendar, MapPin, DollarSign, Target, CheckCircle2, Users, Plus, Pencil, Trash2 } from 'lucide-react'
import { EventFormModal } from './event-form-modal'

interface EventToAttend {
  id: string
  priority: string
  name: string
  category: string
  eventDate: string
  location: string
  estimatedCost: number | null
  whyAttend: string | null
  targetCompanies: string | null
  actionRequired: string | null
  status: string
  remarks: string | null
}

interface EventsViewProps {
  events: EventToAttend[]
}

const PRIORITY_COLORS: Record<string, string> = {
  TIER_1: 'bg-red-100 text-red-800 border-red-200',
  TIER_2: 'bg-orange-100 text-orange-800 border-orange-200',
  TIER_3: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  ENERGY: 'bg-green-100 text-green-800 border-green-200',
}

const PRIORITY_LABELS: Record<string, string> = {
  TIER_1: 'Tier 1',
  TIER_2: 'Tier 2',
  TIER_3: 'Tier 3',
  ENERGY: 'Energy',
}

const CATEGORY_COLORS: Record<string, string> = {
  EVENTS: 'bg-blue-100 text-blue-800',
  AI_TRAINING: 'bg-purple-100 text-purple-800',
  BOTH: 'bg-indigo-100 text-indigo-800',
}

const CATEGORY_LABELS: Record<string, string> = {
  EVENTS: 'Events',
  AI_TRAINING: 'AI Training',
  BOTH: 'Both',
}

const STATUS_COLORS: Record<string, string> = {
  PLANNED: 'bg-gray-100 text-gray-800',
  REGISTERED: 'bg-blue-100 text-blue-800',
  ATTENDED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  SKIPPED: 'bg-yellow-100 text-yellow-800',
}

export function EventsView({ events }: EventsViewProps) {
  const router = useRouter()
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<EventToAttend | null>(null)
  const [deletingEvent, setDeletingEvent] = useState<EventToAttend | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const filteredEvents = events.filter(event => {
    if (priorityFilter !== 'all' && event.priority !== priorityFilter) return false
    if (categoryFilter !== 'all' && event.category !== categoryFilter) return false
    return true
  })

  // Calculate summary stats
  const totalCost = events.reduce((sum, e) => sum + (e.estimatedCost || 0), 0)
  const tier1Count = events.filter(e => e.priority === 'TIER_1').length
  const tier2Count = events.filter(e => e.priority === 'TIER_2').length
  const tier3Count = events.filter(e => e.priority === 'TIER_3').length
  const energyCount = events.filter(e => e.priority === 'ENERGY').length

  const handleSuccess = () => {
    router.refresh()
  }

  const handleDelete = async () => {
    if (!deletingEvent) return
    setIsDeleting(true)
    setDeleteError(null)

    try {
      const response = await fetch(`/api/events-to-attend/${deletingEvent.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setDeletingEvent(null)
        router.refresh()
      } else {
        const data = await response.json()
        setDeleteError(data.error || 'Failed to delete event')
      }
    } catch (error) {
      console.error('Failed to delete event:', error)
      setDeleteError('Failed to delete event')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border border-gray-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{events.length}</div>
            <div className="text-sm text-gray-500">Total Events</div>
          </CardContent>
        </Card>
        <Card className="border border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-700">{tier1Count}</div>
            <div className="text-sm text-red-600">Tier 1 (Priority)</div>
          </CardContent>
        </Card>
        <Card className="border border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-700">{tier2Count}</div>
            <div className="text-sm text-orange-600">Tier 2</div>
          </CardContent>
        </Card>
        <Card className="border border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-700">{tier3Count}</div>
            <div className="text-sm text-yellow-600">Tier 3</div>
          </CardContent>
        </Card>
        <Card className="border border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-700">{energyCount}</div>
            <div className="text-sm text-green-600">Energy Sector</div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Summary */}
      <Card className="border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Estimated Total Budget</div>
              <div className="text-2xl font-bold">RM {totalCost.toLocaleString()}</div>
            </div>
            <DollarSign className="h-8 w-8 text-gray-400" />
          </div>
        </CardContent>
      </Card>

      {/* Filters + Add Button */}
      <div className="flex flex-wrap gap-4">
        <Button onClick={() => { setEditingEvent(null); setFormOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Event
        </Button>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="TIER_1">Tier 1</SelectItem>
            <SelectItem value="TIER_2">Tier 2</SelectItem>
            <SelectItem value="TIER_3">Tier 3</SelectItem>
            <SelectItem value="ENERGY">Energy</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="EVENTS">Events</SelectItem>
            <SelectItem value="AI_TRAINING">AI Training</SelectItem>
            <SelectItem value="BOTH">Both</SelectItem>
          </SelectContent>
        </Select>

        {(priorityFilter !== 'all' || categoryFilter !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setPriorityFilter('all')
              setCategoryFilter('all')
            }}
          >
            Clear filters
          </Button>
        )}

        <div className="ml-auto text-sm text-gray-500">
          Showing {filteredEvents.length} of {events.length} events
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEvents.map(event => (
          <Card
            key={event.id}
            className={cn(
              'border-l-4 hover:shadow-md transition-shadow',
              event.priority === 'TIER_1' && 'border-l-red-500',
              event.priority === 'TIER_2' && 'border-l-orange-500',
              event.priority === 'TIER_3' && 'border-l-yellow-500',
              event.priority === 'ENERGY' && 'border-l-green-500'
            )}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-sm font-semibold line-clamp-2">
                  {event.name}
                </CardTitle>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => { setEditingEvent(event); setFormOpen(true) }}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setDeletingEvent(event)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  <Badge
                    variant="outline"
                    className={cn('text-[10px]', PRIORITY_COLORS[event.priority])}
                  >
                    {PRIORITY_LABELS[event.priority]}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Category & Status */}
              <div className="flex items-center gap-2">
                <Badge className={cn('text-[10px]', CATEGORY_COLORS[event.category])}>
                  {CATEGORY_LABELS[event.category]}
                </Badge>
                <Badge className={cn('text-[10px]', STATUS_COLORS[event.status])}>
                  {event.status.replace('_', ' ')}
                </Badge>
              </div>

              {/* Date & Location */}
              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  <span>{event.eventDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{event.location}</span>
                </div>
                {event.estimatedCost && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-3 w-3" />
                    <span>RM {event.estimatedCost.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Why Attend */}
              {event.whyAttend && (
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-start gap-2 text-xs text-gray-600">
                    <Target className="h-3 w-3 mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{event.whyAttend}</span>
                  </div>
                </div>
              )}

              {/* Target Companies */}
              {event.targetCompanies && (
                <div className="flex items-start gap-2 text-xs text-gray-500">
                  <Users className="h-3 w-3 mt-0.5 shrink-0" />
                  <span className="line-clamp-1">{event.targetCompanies}</span>
                </div>
              )}

              {/* Action Required */}
              {event.actionRequired && (
                <div className="flex items-center gap-2 text-xs text-blue-600 font-medium">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>{event.actionRequired}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Event Form Modal (Create / Edit) */}
      <EventFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={handleSuccess}
        event={editingEvent}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingEvent}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingEvent(null)
            setDeleteError(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingEvent?.name}&quot;?
              This action cannot be undone.
              {deleteError && (
                <span className="block mt-2 text-red-600">
                  {deleteError}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete Event'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
