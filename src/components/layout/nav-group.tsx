'use client'

import { useMemo, useState, useEffect } from 'react'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { NavGroup, NavItem } from '@/lib/nav-config'

interface NavGroupProps {
  group: NavGroup
  isExpanded: boolean
  onToggle: () => void
  pathname: string
  onLinkClick?: () => void
  /** Number of visible items (after filtering). Falls back to group.items.length. */
  visibleCount?: number
  /** Filter function applied to group items before rendering. */
  filterVisible?: (items: NavItem[]) => NavItem[]
}

/**
 * Check if a pathname matches a nav item or any of its children.
 * Used to determine parent active state.
 */
function isItemActive(item: NavItem, pathname: string): boolean {
  if (item.href === '/') return pathname === '/'
  if (pathname === item.href || pathname.startsWith(item.href)) return true
  if (item.children) {
    return item.children.some(
      (child) => pathname === child.href || pathname.startsWith(child.href)
    )
  }
  return false
}

export function NavGroupComponent({
  group,
  isExpanded,
  onToggle,
  pathname,
  onLinkClick,
  visibleCount,
  filterVisible,
}: NavGroupProps) {
  const displayItems = useMemo(
    () => (filterVisible ? filterVisible(group.items) : group.items),
    [filterVisible, group.items]
  )

  const count = visibleCount ?? group.items.length

  // Track which parent items have their children expanded
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})

  // Auto-expand parent whose child is the active route
  useEffect(() => {
    for (const item of displayItems) {
      if (item.children) {
        const childActive = item.children.some(
          (child) => pathname === child.href || pathname.startsWith(child.href)
        )
        if (childActive && !expandedItems[item.href]) {
          setExpandedItems((prev) => ({ ...prev, [item.href]: true }))
        }
      }
    }
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleNested = (href: string) => {
    setExpandedItems((prev) => ({ ...prev, [href]: !prev[href] }))
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 mt-4 hover:text-gray-600 transition-colors">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {group.label} ({count})
        </span>
        <ChevronRight
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform duration-200',
            isExpanded && 'rotate-90'
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="flex flex-col gap-1">
          {displayItems.map((item) => {
            // Filter visible children
            const visibleChildren = item.children
              ? filterVisible
                ? filterVisible(item.children)
                : item.children
              : []

            const hasVisibleChildren = visibleChildren.length > 0
            const parentActive = isItemActive(item, pathname)
            const isNestedExpanded = expandedItems[item.href] ?? false

            // Item WITH children: split click zones
            if (item.children) {
              return (
                <div key={item.href}>
                  <div
                    className={cn(
                      'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      parentActive
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <Link
                      href={item.href}
                      onClick={onLinkClick}
                      className="flex items-center gap-3 flex-1 min-w-0"
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                    {hasVisibleChildren && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleNested(item.href)
                        }}
                        className="p-1 rounded hover:bg-gray-200 transition-colors"
                        aria-label={
                          isNestedExpanded
                            ? `Collapse ${item.name} sub-items`
                            : `Expand ${item.name} sub-items`
                        }
                      >
                        <ChevronRight
                          className={cn(
                            'h-3.5 w-3.5 text-gray-400 transition-transform duration-200',
                            isNestedExpanded && 'rotate-90'
                          )}
                        />
                      </button>
                    )}
                  </div>
                  {isNestedExpanded && hasVisibleChildren && (
                    <div className="flex flex-col gap-0.5 mt-0.5">
                      {visibleChildren.map((child) => {
                        const childActive =
                          pathname === child.href ||
                          pathname.startsWith(child.href)
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={onLinkClick}
                            className={cn(
                              'flex items-center gap-3 rounded-lg pl-9 pr-3 py-1.5 text-sm transition-colors',
                              childActive
                                ? 'bg-gray-100 text-gray-900 font-medium'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                            )}
                          >
                            <child.icon className="h-4 w-4" />
                            {child.name}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }

            // Item WITHOUT children: render as before
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onLinkClick}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
