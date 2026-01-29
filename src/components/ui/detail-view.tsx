'use client'

import * as React from 'react'
import Link from 'next/link'
import { Expand } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useDetailViewMode } from '@/lib/hooks/use-detail-view-mode'
import { cn } from '@/lib/utils'

interface DetailViewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  children: React.ReactNode
  className?: string
  expandHref?: string
  footer?: React.ReactNode
  headerClassName?: string
  contentClassName?: string
}

function ExpandButton({ href }: { href: string }) {
  return (
    <Link href={href}>
      <Button variant="ghost" size="icon" className="h-7 w-7">
        <Expand className="h-4 w-4" />
        <span className="sr-only">Open full page</span>
      </Button>
    </Link>
  )
}

export function DetailView({
  open,
  onOpenChange,
  title,
  children,
  className,
  expandHref,
  footer,
  headerClassName,
  contentClassName,
}: DetailViewProps) {
  const { mode } = useDetailViewMode()

  // Responsive drawer direction: right on desktop, bottom on mobile
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    setIsMobile(!mq.matches)

    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(!e.matches)
    }

    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  if (mode === 'drawer') {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side={isMobile ? 'bottom' : 'right'}
          resizable={!isMobile}
          className={cn(
            isMobile && 'h-[85vh] rounded-t-2xl flex flex-col',
            !isMobile && 'h-screen flex flex-col',
            className
          )}
        >
          <SheetHeader className={cn('pr-8 shrink-0', headerClassName)}>
            <div className="flex items-center justify-between">
              <SheetTitle className="text-left text-lg leading-snug flex-1">
                {title}
              </SheetTitle>
              {expandHref && <ExpandButton href={expandHref} />}
            </div>
          </SheetHeader>
          <div className={cn('flex-1 min-h-0 mt-4 overflow-y-auto', contentClassName)}>
            {children}
          </div>
          {footer && (
            <div className="p-4 border-t shrink-0 mt-auto">
              {footer}
            </div>
          )}
        </SheetContent>
      </Sheet>
    )
  }

  // Default: dialog mode
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('md:max-w-[650px] p-0 flex flex-col max-h-[calc(100vh-2rem)] md:max-h-[85vh]', className)}>
        <DialogHeader className={cn('p-6 pb-4 border-b shrink-0 pr-12', headerClassName)}>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-left text-lg leading-snug flex-1">
              {title}
            </DialogTitle>
            {expandHref && <ExpandButton href={expandHref} />}
          </div>
        </DialogHeader>
        <div className={cn('flex-1 min-h-0 overflow-y-auto', contentClassName)}>
          {children}
        </div>
        {footer && (
          <DialogFooter className="p-4 border-t shrink-0">
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
