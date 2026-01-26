'use client'

import { SessionProvider } from 'next-auth/react'
import { DetailViewProvider } from '@/lib/detail-view-context'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <DetailViewProvider>{children}</DetailViewProvider>
    </SessionProvider>
  )
}
