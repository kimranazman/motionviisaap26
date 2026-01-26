'use client'

import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Layers, PanelRight } from 'lucide-react'
import { useDetailViewMode } from '@/lib/hooks/use-detail-view-mode'

export function DetailViewToggle() {
  const { mode, toggle, isLoading } = useDetailViewMode()

  if (isLoading) return null

  const Icon = mode === 'dialog' ? Layers : PanelRight
  const label = mode === 'dialog' ? 'Switch to drawer mode' : 'Switch to dialog mode'

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hidden md:inline-flex"
            onClick={toggle}
          >
            <Icon className="h-4 w-4" />
            <span className="sr-only">{label}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
