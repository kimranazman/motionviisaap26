'use client'

import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ShieldAlert } from 'lucide-react'

interface PermissionDeniedDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  requiredRole?: 'editor' | 'admin'
  redirectTo?: string
}

export function PermissionDeniedDialog({
  open,
  onOpenChange,
  requiredRole = 'editor',
  redirectTo,
}: PermissionDeniedDialogProps) {
  const router = useRouter()

  const handleDismiss = () => {
    onOpenChange(false)
    if (redirectTo) {
      router.push(redirectTo)
    }
  }

  const roleText = requiredRole === 'admin' ? 'Admin' : 'Editor or Admin'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <ShieldAlert className="h-5 w-5 text-red-600" />
            </div>
            <DialogTitle>Permission Denied</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            You don&apos;t have permission to perform this action.
            This requires {roleText} role.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleDismiss} className="w-full sm:w-auto">
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
