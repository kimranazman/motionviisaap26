'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { isAlwaysVisible } from '@/lib/nav-config'

/**
 * Hook for managing sidebar nav item visibility.
 * Fetches hidden items from the preferences API and provides
 * toggle + auto-reveal functionality.
 */
export function useNavVisibility() {
  const [hiddenItems, setHiddenItems] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const lastRevealedRef = useRef<string | null>(null)

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
   * Toggle a nav item's visibility.
   * Always-visible items cannot be hidden.
   * Optimistically updates state, then persists to API.
   */
  const toggleItem = useCallback(
    (href: string) => {
      if (isAlwaysVisible(href)) return

      setHiddenItems((prev) => {
        const isHidden = prev.includes(href)
        const next = isHidden ? prev.filter((h) => h !== href) : [...prev, href]

        // Persist to API (fire-and-forget)
        fetch('/api/user/preferences', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hiddenNavItems: next }),
        }).catch(console.error)

        return next
      })
    },
    []
  )

  /**
   * Auto-reveal a hidden nav item when the user navigates directly to its URL.
   * Only fires once per pathname to avoid infinite loops.
   */
  const autoReveal = useCallback(
    (pathname: string) => {
      if (isLoading) return
      if (lastRevealedRef.current === pathname) return

      // Check if any hidden item matches the current pathname
      const matchedHref = hiddenItems.find((href) => {
        if (href === '/') return pathname === '/'
        return pathname === href || pathname.startsWith(href)
      })

      if (matchedHref) {
        lastRevealedRef.current = pathname
        setHiddenItems((prev) => {
          const next = prev.filter((h) => h !== matchedHref)

          fetch('/api/user/preferences', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hiddenNavItems: next }),
          }).catch(console.error)

          return next
        })
      }
    },
    [hiddenItems, isLoading]
  )

  return { hiddenItems, isLoading, isVisible, toggleItem, autoReveal }
}
