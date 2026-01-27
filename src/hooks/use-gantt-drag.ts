'use client'

import { useState, useEffect, useCallback, type RefObject } from 'react'

interface UseGanttDragOptions {
  chartRef: RefObject<HTMLDivElement | null>
  onDatesChange: (id: string, startDate: string, endDate: string) => Promise<void>
}

export interface DragState {
  id: string
  mode: 'move' | 'resize-left' | 'resize-right'
  startMouseX: number
  originalStart: Date
  originalEnd: Date
  currentStart: Date
  currentEnd: Date
  hasDragged: boolean
}

const YEAR_START = new Date(2026, 0, 1)
const YEAR_END = new Date(2026, 11, 31)
const DRAG_THRESHOLD_PX = 3
const MS_PER_DAY = 1000 * 60 * 60 * 24
const TOTAL_DAYS = Math.round((YEAR_END.getTime() - YEAR_START.getTime()) / MS_PER_DAY)

function clampDate(date: Date, min: Date, max: Date): Date {
  if (date < min) return new Date(min)
  if (date > max) return new Date(max)
  return date
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY)
}

export function useGanttDrag({ chartRef, onDatesChange }: UseGanttDragOptions) {
  const [dragState, setDragState] = useState<DragState | null>(null)

  const handleMouseDown = useCallback((
    e: React.MouseEvent,
    id: string,
    mode: 'move' | 'resize-left' | 'resize-right',
    startDate: string,
    endDate: string,
  ) => {
    e.preventDefault()
    e.stopPropagation()

    const originalStart = new Date(startDate)
    const originalEnd = new Date(endDate)

    setDragState({
      id,
      mode,
      startMouseX: e.clientX,
      originalStart,
      originalEnd,
      currentStart: new Date(originalStart),
      currentEnd: new Date(originalEnd),
      hasDragged: false,
    })
  }, [])

  useEffect(() => {
    if (!dragState) return

    const handleMouseMove = (e: MouseEvent) => {
      const containerWidth = chartRef.current?.offsetWidth
      if (!containerWidth) return

      const deltaX = e.clientX - dragState.startMouseX
      const absDelta = Math.abs(deltaX)

      // Convert pixel delta to days
      const daysDelta = Math.round(deltaX * TOTAL_DAYS / containerWidth)

      const newHasDragged = dragState.hasDragged || absDelta > DRAG_THRESHOLD_PX

      let newStart: Date
      let newEnd: Date

      switch (dragState.mode) {
        case 'move': {
          // Shift both dates, preserve duration
          const duration = dragState.originalEnd.getTime() - dragState.originalStart.getTime()
          newStart = addDays(dragState.originalStart, daysDelta)
          newEnd = new Date(newStart.getTime() + duration)

          // Clamp both while preserving duration
          if (newStart < YEAR_START) {
            newStart = new Date(YEAR_START)
            newEnd = new Date(newStart.getTime() + duration)
          }
          if (newEnd > YEAR_END) {
            newEnd = new Date(YEAR_END)
            newStart = new Date(newEnd.getTime() - duration)
          }
          break
        }
        case 'resize-left': {
          // Only start changes, end stays
          newStart = addDays(dragState.originalStart, daysDelta)
          newEnd = new Date(dragState.originalEnd)

          // Clamp: start >= yearStart and start < end - 1 day
          newStart = clampDate(newStart, YEAR_START, addDays(newEnd, -1))
          break
        }
        case 'resize-right': {
          // Only end changes, start stays
          newStart = new Date(dragState.originalStart)
          newEnd = addDays(dragState.originalEnd, daysDelta)

          // Clamp: end <= yearEnd and end > start + 1 day
          newEnd = clampDate(newEnd, addDays(newStart, 1), YEAR_END)
          break
        }
      }

      setDragState(prev => prev ? {
        ...prev,
        currentStart: newStart,
        currentEnd: newEnd,
        hasDragged: newHasDragged,
      } : null)
    }

    const handleMouseUp = () => {
      if (dragState.hasDragged) {
        onDatesChange(
          dragState.id,
          dragState.currentStart.toISOString(),
          dragState.currentEnd.toISOString(),
        )
      }
      setDragState(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragState, chartRef, onDatesChange])

  return {
    dragState,
    handleMouseDown,
    isDragging: dragState !== null,
    hasDragged: dragState?.hasDragged ?? false,
  }
}
