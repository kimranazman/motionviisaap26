'use client'

import { useState, useEffect, useCallback } from 'react'
import { isAlwaysVisible } from '@/lib/nav-config'
import type { NavItem } from '@/lib/nav-config'

/**
 * Hook for managing sidebar nav item visibility and ordering.
 * Fetches hidden items and custom order from the preferences API
 * and provides toggle, ordering, and batch save functionality.
 */
export function useNavVisibility() {
  const [hiddenItems, setHiddenItems] = useState<string[]>([])
  const [navItemOrder, setNavItemOrder] = useState<Record<string, string[]> | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch hidden items and nav order on mount
  useEffect(() => {
    fetch('/api/user/preferences')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.hiddenNavItems)) {
          setHiddenItems(data.hiddenNavItems)
        }
        if (data.navItemOrder) {
          setNavItemOrder(data.navItemOrder)
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

  /**
   * Returns items sorted by the user's custom order for a group.
   * Items not in the saved order are appended at the end (handles new items).
   */
  const getOrderedItems = useCallback(
    (groupKey: string, items: NavItem[]): NavItem[] => {
      if (!navItemOrder || !navItemOrder[groupKey]) return items
      const order = navItemOrder[groupKey]
      const sorted = [...items].sort((a, b) => {
        const idxA = order.indexOf(a.href)
        const idxB = order.indexOf(b.href)
        // Items not in order go to end
        const posA = idxA === -1 ? order.length : idxA
        const posB = idxB === -1 ? order.length : idxB
        return posA - posB
      })
      return sorted
    },
    [navItemOrder]
  )

  /**
   * Persist nav item order to the API.
   * Updates local state atomically on success.
   */
  const saveNavOrder = useCallback(
    async (order: Record<string, string[]>) => {
      const response = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ navItemOrder: order }),
      })
      if (!response.ok) throw new Error('Failed to save')
      setNavItemOrder(order)
    },
    []
  )

  return {
    hiddenItems,
    navItemOrder,
    isLoading,
    isVisible,
    toggleItem,
    saveHiddenItems,
    getOrderedItems,
    saveNavOrder,
  }
}
