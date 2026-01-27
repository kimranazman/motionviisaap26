'use client'

import { useState, useEffect, useCallback } from 'react'
import { findGroupForPath } from '@/lib/nav-config'

const STORAGE_KEY = 'sidebar-collapse-state'

const DEFAULT_STATE: Record<string, boolean> = {
  saap: true,
  crm: true,
  admin: true,
}

/**
 * SSR-safe localStorage-backed collapse state hook.
 * All groups default to expanded. Active route's group auto-expands.
 */
export function useNavCollapseState(pathname: string) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(DEFAULT_STATE)
  const [hydrated, setHydrated] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed && typeof parsed === 'object') {
          setExpandedGroups(parsed)
        }
      }
    } catch {
      // Ignore parse errors
    }
    setHydrated(true)
  }, [])

  // Auto-expand group for active route (NAV-07)
  useEffect(() => {
    if (!hydrated) return

    const groupKey = findGroupForPath(pathname)
    if (groupKey && !expandedGroups[groupKey]) {
      const updated = { ...expandedGroups, [groupKey]: true }
      setExpandedGroups(updated)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch {
        // Ignore storage errors
      }
    }
  }, [pathname, hydrated]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleGroup = useCallback((key: string) => {
    setExpandedGroups(prev => {
      const updated = { ...prev, [key]: !prev[key] }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch {
        // Ignore storage errors
      }
      return updated
    })
  }, [])

  return { expandedGroups, toggleGroup }
}
