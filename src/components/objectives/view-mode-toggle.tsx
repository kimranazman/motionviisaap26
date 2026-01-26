'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Target, List, KanbanSquare, GanttChart, Calendar } from 'lucide-react'

const VIEW_MODES = [
  { name: 'By Objective', href: '/objectives', icon: Target },
  { name: 'List', href: '/initiatives', icon: List },
  { name: 'Kanban', href: '/kanban', icon: KanbanSquare },
  { name: 'Timeline', href: '/timeline', icon: GanttChart },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
]

export function ViewModeToggle() {
  const pathname = usePathname()

  return (
    <div className="overflow-x-auto -mx-3 px-3 md:mx-0 md:px-0">
      <div className="inline-flex items-center rounded-lg bg-white border border-gray-200 p-1 shadow-sm">
        {VIEW_MODES.map(mode => (
          <Link
            key={mode.href}
            href={mode.href}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
              pathname === mode.href
                ? 'bg-gray-100 text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            )}
          >
            <mode.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{mode.name}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
