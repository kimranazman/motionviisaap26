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
  children?: NavItem[]
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
      { name: 'Companies', href: '/companies', icon: Building2, children: [
        { name: 'Departments', href: '/departments', icon: Building },
        { name: 'Contacts', href: '/contacts', icon: Contact },
      ]},
      { name: 'Pipeline', href: '/pipeline', icon: Funnel },
      { name: 'Potential Projects', href: '/potential-projects', icon: FolderKanban },
      { name: 'Projects', href: '/projects', icon: Briefcase },
      { name: 'Suppliers', href: '/suppliers', icon: Truck },
      { name: 'Pricing History', href: '/supplier-items', icon: Scale },
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

/** Hrefs that can never be hidden from the sidebar */
export const ALWAYS_VISIBLE_HREFS = new Set<string>(['/', '/settings'])

/** Returns true if the given href must always be visible */
export function isAlwaysVisible(href: string): boolean {
  return ALWAYS_VISIBLE_HREFS.has(href)
}

/** Returns all nav item hrefs (groups + top-level + settings) */
export function getAllNavHrefs(): string[] {
  const hrefs: string[] = []
  for (const group of navGroups) {
    for (const item of group.items) {
      hrefs.push(item.href)
      if (item.children) {
        for (const child of item.children) {
          hrefs.push(child.href)
        }
      }
    }
  }
  for (const item of topLevelItems) {
    hrefs.push(item.href)
  }
  hrefs.push(settingsItem.href)
  return hrefs
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
      if (item.children) {
        for (const child of item.children) {
          if (pathname === child.href || pathname.startsWith(child.href)) return group.key
        }
      }
    }
  }
  return null
}

/** Returns the default item order (hrefs) for each nav group */
export function getDefaultNavOrder(): Record<string, string[]> {
  const order: Record<string, string[]> = {}
  for (const group of navGroups) {
    order[group.key] = group.items.map((item) => item.href)
  }
  return order
}
