'use client'

import { useMemo } from 'react'
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
