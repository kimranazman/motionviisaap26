'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Menu, Target } from 'lucide-react'
import {
  LayoutDashboard,
  GanttChart,
  KanbanSquare,
  Calendar,
  ListTodo,
  Ticket,
  Users,
  Building2,
  Funnel,
  FolderKanban,
  Briefcase,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Timeline', href: '/timeline', icon: GanttChart },
  { name: 'Kanban', href: '/kanban', icon: KanbanSquare },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Initiatives', href: '/initiatives', icon: ListTodo },
  { name: 'Events to Attend', href: '/events', icon: Ticket },
]

const crmNavigation = [
  { name: 'Companies', href: '/companies', icon: Building2 },
  { name: 'Pipeline', href: '/pipeline', icon: Funnel },
  { name: 'Potential Projects', href: '/potential-projects', icon: FolderKanban },
  { name: 'Projects', href: '/projects', icon: Briefcase },
]

export function MobileSidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()

  const NavLink = ({ item }: { item: { name: string; href: string; icon: React.ComponentType<{ className?: string }> } }) => {
    const isActive = pathname === item.href ||
      (item.href !== '/' && pathname.startsWith(item.href))
    return (
      <Link
        href={item.href}
        onClick={() => setOpen(false)}
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
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
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
        <nav className="flex flex-col gap-1 p-4 overflow-y-auto max-h-[calc(100vh-80px)]">
          {navigation.map((item) => (
            <NavLink key={item.name} item={item} />
          ))}

          {/* CRM Section */}
          <div className="mt-6 mb-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            CRM
          </div>
          {crmNavigation.map((item) => (
            <NavLink key={item.name} item={item} />
          ))}

          {/* Admin Section */}
          {session?.user?.role === "ADMIN" && (
            <>
              <div className="mt-6 mb-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Admin
              </div>
              <NavLink item={{ name: 'Users', href: '/admin/users', icon: Users }} />
            </>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
