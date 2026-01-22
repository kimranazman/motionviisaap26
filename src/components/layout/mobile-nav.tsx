'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ListTodo, Funnel, Ticket } from 'lucide-react'
import { cn } from '@/lib/utils'

const mobileNavItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Initiatives', href: '/initiatives', icon: ListTodo },
  { name: 'CRM', href: '/pipeline', icon: Funnel },
  { name: 'Events', href: '/events', icon: Ticket },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200",
      "pb-safe md:hidden"
    )}>
      <div className="grid h-16 grid-cols-4 max-w-lg mx-auto">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex flex-col items-center justify-center",
                "min-h-[48px] min-w-[48px]",
                "text-gray-500 hover:text-gray-900 transition-colors",
                isActive && "text-blue-600"
              )}
            >
              <item.icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
