'use client'

import { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { Target, ChevronRight } from 'lucide-react'
import { navGroups, topLevelItems, settingsItem } from '@/lib/nav-config'
import { useNavCollapseState } from '@/lib/hooks/use-nav-collapse-state'
import { useNavVisibility } from '@/lib/hooks/use-nav-visibility'
import { NavGroupComponent } from '@/components/layout/nav-group'

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { expandedGroups, toggleGroup } = useNavCollapseState(pathname)
  const { isVisible, getOrderedItems } = useNavVisibility()

  // Filter groups and their items by visibility, applying custom order
  const visibleGroups = useMemo(() => {
    return navGroups
      .filter((group) => !group.requireRole || session?.user?.role === group.requireRole)
      .map((group) => {
        const orderedItems = getOrderedItems(group.key, group.items)
        const visibleItems = orderedItems.filter((item) => isVisible(item.href))
        return { group, visibleItems }
      })
      .filter(({ visibleItems }) => visibleItems.length > 0)
  }, [session?.user?.role, isVisible, getOrderedItems])

  // Filter top-level items by visibility
  const visibleTopLevel = useMemo(
    () => topLevelItems.filter((item) => isVisible(item.href)),
    [isVisible]
  )

  // Track which top-level items have their children expanded
  const [expandedTopLevel, setExpandedTopLevel] = useState<Record<string, boolean>>({})

  // Auto-expand top-level item whose child is active
  useEffect(() => {
    for (const item of visibleTopLevel) {
      if (item.children) {
        const childActive = item.children.some(
          (child) => pathname === child.href || pathname.startsWith(child.href)
        )
        if (childActive && !expandedTopLevel[item.href]) {
          setExpandedTopLevel((prev) => ({ ...prev, [item.href]: true }))
        }
      }
    }
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleTopLevel = (href: string) => {
    setExpandedTopLevel((prev) => ({ ...prev, [href]: !prev[href] }))
  }

  return (
    <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-50 md:flex md:flex-col md:w-64 bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-200 shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
          <Target className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">SAAP 2026</h1>
          <p className="text-xs text-gray-500">MotionVii</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto flex flex-col gap-1 p-4">
        {/* Collapsible groups */}
        {visibleGroups.map(({ group, visibleItems }) => (
          <NavGroupComponent
            key={group.key}
            group={group}
            visibleCount={visibleItems.length}
            isExpanded={expandedGroups[group.key] ?? true}
            onToggle={() => toggleGroup(group.key)}
            pathname={pathname}
            filterVisible={(items) => {
              const ordered = getOrderedItems(group.key, items)
              return ordered.filter((item) => isVisible(item.href))
            }}
          />
        ))}

        {/* Top-level items (Members) */}
        {visibleTopLevel.length > 0 && (
          <div className="mt-4 flex flex-col gap-1">
            {visibleTopLevel.map((item) => {
              const hasChildren = item.children && item.children.length > 0
              const isExpanded = expandedTopLevel[item.href] ?? false
              const isActive =
                pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href))

              if (hasChildren) {
                return (
                  <div key={item.href}>
                    <div
                      className={cn(
                        'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      <Link
                        href={item.href}
                        className="flex items-center gap-3 flex-1 min-w-0"
                      >
                        <item.icon className="h-5 w-5" />
                        {item.name}
                      </Link>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleTopLevel(item.href)
                        }}
                        className="p-1 rounded hover:bg-gray-200 transition-colors"
                        aria-label={
                          isExpanded
                            ? `Collapse ${item.name} sub-items`
                            : `Expand ${item.name} sub-items`
                        }
                      >
                        <ChevronRight
                          className={cn(
                            'h-3.5 w-3.5 text-gray-400 transition-transform duration-200',
                            isExpanded && 'rotate-90'
                          )}
                        />
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="flex flex-col gap-0.5 mt-0.5">
                        {item.children!.map((child) => {
                          const childActive =
                            pathname === child.href ||
                            pathname.startsWith(child.href)
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
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

              return (
                <Link
                  key={item.href}
                  href={item.href}
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
        )}

        {/* Settings */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <Link
            href={settingsItem.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              pathname.startsWith(settingsItem.href)
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <settingsItem.icon className="h-5 w-5" />
            {settingsItem.name}
          </Link>
        </div>
      </nav>
    </aside>
  )
}
