import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Target,
  GanttChart,
  KanbanSquare,
  Calendar,
  ListTodo,
  ClipboardList,
  Ticket,
  Building2,
  Building,
  Contact,
  Funnel,
  FolderKanban,
  Briefcase,
  Truck,
  Scale,
  Users,
  ListChecks,
  Users2,
  Settings,
} from 'lucide-react'

export interface NavItem {
  name: string
  href: string
  icon: LucideIcon
}

export interface NavGroup {
  key: string
  label: string
  items: NavItem[]
  requireRole?: string
}

export type TopLevelNavItem = NavItem

export const navGroups: NavGroup[] = [
  {
    key: 'saap',
    label: 'SAAP',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'By Objective', href: '/objectives', icon: Target },
      { name: 'Timeline', href: '/timeline', icon: GanttChart },
      { name: 'Kanban', href: '/kanban', icon: KanbanSquare },
      { name: 'Calendar', href: '/calendar', icon: Calendar },
      { name: 'Initiatives', href: '/initiatives', icon: ListTodo },
      { name: 'Support Tasks', href: '/support-tasks', icon: ClipboardList },
      { name: 'Events to Attend', href: '/events', icon: Ticket },
    ],
  },
  {
    key: 'crm',
    label: 'CRM',
    items: [
      { name: 'Companies', href: '/companies', icon: Building2 },
      { name: 'Departments', href: '/departments', icon: Building },
      { name: 'Contacts', href: '/contacts', icon: Contact },
      { name: 'Pipeline', href: '/pipeline', icon: Funnel },
      { name: 'Potential Projects', href: '/potential-projects', icon: FolderKanban },
      { name: 'Projects', href: '/projects', icon: Briefcase },
      { name: 'Suppliers', href: '/suppliers', icon: Truck },
      { name: 'Price Comparison', href: '/supplier-items', icon: Scale },
    ],
  },
  {
    key: 'admin',
    label: 'Admin',
    requireRole: 'ADMIN',
    items: [
      { name: 'Users', href: '/admin/users', icon: Users },
    ],
  },
]

export const topLevelItems: TopLevelNavItem[] = [
  { name: 'Tasks', href: '/tasks', icon: ListChecks },
  { name: 'Members', href: '/members', icon: Users2 },
]

export const settingsItem: NavItem = {
  name: 'Settings',
  href: '/settings',
  icon: Settings,
}

/**
 * Find which nav group contains a route matching the given pathname.
 * Returns the group key or null if no match.
 */
export function findGroupForPath(pathname: string): string | null {
  for (const group of navGroups) {
    for (const item of group.items) {
      if (item.href === '/') {
        if (pathname === '/') return group.key
      } else {
        if (pathname === item.href || pathname.startsWith(item.href)) return group.key
      }
    }
  }
  return null
}
