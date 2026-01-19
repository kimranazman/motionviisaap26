'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  GanttChart,
  KanbanSquare,
  Calendar,
  ListTodo,
  Settings,
  Target,
  Ticket,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Timeline', href: '/timeline', icon: GanttChart },
  { name: 'Kanban', href: '/kanban', icon: KanbanSquare },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Initiatives', href: '/initiatives', icon: ListTodo },
  { name: 'Events to Attend', href: '/events', icon: Ticket },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-200">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
          <Target className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">SAAP 2026</h1>
          <p className="text-xs text-gray-500">MotionVii</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
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
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-4">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        >
          <Settings className="h-5 w-5" />
          Settings
        </Link>
        <div className="mt-4 px-3">
          <div className="text-xs text-gray-400">Revenue Target 2026</div>
          <div className="mt-1 text-lg font-semibold text-gray-900">RM 1,000,000</div>
          <div className="mt-1 flex gap-2 text-xs text-gray-500">
            <span>Events: RM 800K</span>
            <span>|</span>
            <span>AI: RM 200K</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
