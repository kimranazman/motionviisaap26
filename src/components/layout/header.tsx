'use client'

import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { HeaderSearch } from './header-search'
import { NotificationBell } from './notification-bell'
import { MobileSidebar } from './mobile-sidebar'
import { SignOutButton } from '@/components/auth/sign-out-button'
import { DetailViewToggle } from './detail-view-toggle'
import { useDetailViewMode } from '@/lib/hooks/use-detail-view-mode'
import { PanelRight, Columns2, Settings } from 'lucide-react'
import Link from 'next/link'

interface HeaderProps {
  title: string
  description?: string
}

export function Header({ title, description }: HeaderProps) {
  const { data: session } = useSession()
  const { mode, toggle } = useDetailViewMode()

  // Get initials from name or email
  const getInitials = () => {
    if (session?.user?.name) {
      return session.user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    if (session?.user?.email) {
      return session.user.email.slice(0, 2).toUpperCase()
    }
    return '?'
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 md:h-16 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6">
      {/* Mobile: Hamburger + Title */}
      <div className="flex items-center gap-2 md:hidden">
        <MobileSidebar />
        <h1 className="text-lg font-semibold text-gray-900 truncate max-w-[200px]">{title}</h1>
      </div>

      {/* Desktop: Title + Description */}
      <div className="hidden md:block">
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        {description && (
          <p className="text-sm text-gray-500">{description}</p>
        )}
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Mobile search icon */}
        <div className="md:hidden">
          <HeaderSearch mobile />
        </div>

        {/* Desktop search */}
        <div className="hidden md:block">
          <HeaderSearch />
        </div>

        {/* Detail View Toggle */}
        <DetailViewToggle />

        {/* Notifications */}
        <NotificationBell />

        {/* User Menu - works on all sizes */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-600 text-white text-sm">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {session?.user?.name || 'User'}
                </p>
                <p className="text-xs leading-none text-gray-500">
                  {session?.user?.email || ''}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={(e) => { e.preventDefault(); toggle(); }}>
              {mode === 'dialog' ? (
                <>
                  <PanelRight className="h-4 w-4 mr-2" />
                  Switch to Drawer
                </>
              ) : (
                <>
                  <Columns2 className="h-4 w-4 mr-2" />
                  Switch to Dialog
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <SignOutButton
                variant="ghost"
                className="w-full justify-start cursor-pointer"
              />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
