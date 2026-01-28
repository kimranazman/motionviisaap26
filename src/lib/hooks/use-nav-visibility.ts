'use client'

import { useState, useEffect, useCallback } from 'react'
import { isAlwaysVisible } from '@/lib/nav-config'

/**
 * Hook for managing sidebar nav item visibility.
 * Fetches hidden items from the preferences API and provides
 * toggle + batch save functionality.
 */
export function useNavVisibility() {
  const [hiddenItems, setHiddenItems] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch hidden items on mount
  useEffect(() => {
    fetch('/api/user/preferences')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.hiddenNavItems)) {
          setHiddenItems(data.hiddenNavItems)
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  /**
   * Returns true if a nav item should be shown.
   * During loading, all items are visible to prevent flash.
   * Always-visible items are never hidden.
   */
  const isVisible = useCallback(
    (href: string): boolean => {
      if (isLoading) return true
      if (isAlwaysVisible(href)) return true
      return !hiddenItems.includes(href)
    },
    [hiddenItems, isLoading]
  )

  /**
   * Toggle a nav item's visibility in local state only.
   * Always-visible items cannot be hidden.
   * Does NOT persist to API -- use saveHiddenItems for that.
   */
  const toggleItem = useCallback(
    (href: string) => {
      if (isAlwaysVisible(href)) return

      setHiddenItems((prev) => {
        const isHidden = prev.includes(href)
        return isHidden ? prev.filter((h) => h !== href) : [...prev, href]
      })
    },
    []
  )

  /**
   * Persist hidden items to the API in a single batch call.
   * Updates local state atomically on success.
   */
  const saveHiddenItems = useCallback(
    async (items: string[]) => {
      const response = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hiddenNavItems: items }),
      })
      if (!response.ok) throw new Error('Failed to save')
      setHiddenItems(items)
    },
    []
  )

  return { hiddenItems, isLoading, isVisible, toggleItem, saveHiddenItems }
}
