'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

interface PendingCounts {
  costs: number
  invoices: number
  receipts: number
  deliverables: number
  total: number
}

export function AiAnalyzeButton() {
  // State
  const [counts, setCounts] = useState<PendingCounts | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isTriggering, setIsTriggering] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const initialCountRef = useRef<number>(0)
  const pollCountRef = useRef<number>(0)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch pending counts
  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch('/api/ai/pending')
      if (res.ok) {
        const data = await res.json()
        setCounts({
          costs: data.costs,
          invoices: data.invoices,
          receipts: data.receipts,
          deliverables: data.deliverables,
          total: data.total,
        })
        return data.total
      }
    } catch (error) {
      console.error('Error fetching pending counts:', error)
    }
    return null
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchCounts().finally(() => setIsLoading(false))
  }, [fetchCounts])

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
    setIsPolling(false)
    pollCountRef.current = 0
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [])

  // Start polling
  const startPolling = useCallback(() => {
    initialCountRef.current = counts?.total ?? 0
    pollCountRef.current = 0
    setIsPolling(true)

    pollIntervalRef.current = setInterval(async () => {
      pollCountRef.current += 1
      const newTotal = await fetchCounts()

      if (newTotal !== null) {
        const diff = initialCountRef.current - newTotal
        if (diff > 0) {
          toast.success(`${diff} item${diff > 1 ? 's' : ''} analyzed`)
          stopPolling()
          return
        }
      }

      // Max 6 polls (90 seconds)
      if (pollCountRef.current >= 6) {
        toast.info('Still running on Mac', {
          description: 'Analysis may take longer than expected',
        })
        stopPolling()
      }
    }, 15000)
  }, [counts?.total, fetchCounts, stopPolling])

  // Trigger analysis
  const handleTrigger = async (type: string) => {
    if (isTriggering || isPolling) return

    setIsTriggering(true)
    toast.info('Analyzing...', { description: `Running ${type} analysis` })

    try {
      const res = await fetch('/api/ai/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })

      if (res.status === 202) {
        startPolling()
      } else if (res.status === 403) {
        toast.error('Admin access required')
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error('Analysis failed', {
          description: data.error || 'SSH connection failed',
        })
      }
    } catch (error) {
      toast.error('Failed to start analysis', {
        description: 'Network error',
      })
    } finally {
      setIsTriggering(false)
    }
  }

  const total = counts?.total ?? 0
  const showBadge = !isLoading && total > 0

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          disabled={isTriggering}
        >
          {isTriggering || isPolling ? (
            <Loader2 className="h-5 w-5 text-purple-600 animate-spin" />
          ) : (
            <Sparkles className="h-5 w-5 text-purple-600" />
          )}
          {showBadge && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-purple-500 text-[10px] font-medium text-white">
              {total > 99 ? '99+' : total}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>AI Analysis</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleTrigger('all')}
          disabled={total === 0 || isTriggering || isPolling}
        >
          Analyze All ({total})
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleTrigger('costs')}
          disabled={(counts?.costs ?? 0) === 0 || isTriggering || isPolling}
        >
          Costs ({counts?.costs ?? 0})
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleTrigger('invoice')}
          disabled={(counts?.invoices ?? 0) === 0 || isTriggering || isPolling}
        >
          Invoices ({counts?.invoices ?? 0})
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleTrigger('receipt')}
          disabled={(counts?.receipts ?? 0) === 0 || isTriggering || isPolling}
        >
          Receipts ({counts?.receipts ?? 0})
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleTrigger('deliverables')}
          disabled={(counts?.deliverables ?? 0) === 0 || isTriggering || isPolling}
        >
          Deliverables ({counts?.deliverables ?? 0})
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
