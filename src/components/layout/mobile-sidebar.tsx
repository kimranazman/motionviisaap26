'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Menu, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { navGroups, topLevelItems, settingsItem } from '@/lib/nav-config'
import { useNavCollapseState } from '@/lib/hooks/use-nav-collapse-state'
import { useNavVisibility } from '@/lib/hooks/use-nav-visibility'
import { NavGroupComponent } from '@/components/layout/nav-group'

export function MobileSidebar() {
  const [open, setOpen] = useState(false)
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
          {/* Collapsible groups */}
          {visibleGroups.map(({ group, visibleItems }) => (
            <NavGroupComponent
              key={group.key}
              group={group}
              visibleCount={visibleItems.length}
              isExpanded={expandedGroups[group.key] ?? true}
              onToggle={() => toggleGroup(group.key)}
              pathname={pathname}
              onLinkClick={() => setOpen(false)}
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
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/' && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
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
              })}
            </div>
          )}

          {/* Settings */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <Link
              href={settingsItem.href}
              onClick={() => setOpen(false)}
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
      </SheetContent>
    </Sheet>
  )
}
