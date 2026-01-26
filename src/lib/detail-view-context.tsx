'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

export type DetailViewMode = 'dialog' | 'drawer'

interface DetailViewContextType {
  mode: DetailViewMode
  setMode: (mode: DetailViewMode) => void
  toggle: () => void
  isLoading: boolean
}

const DetailViewContext = createContext<DetailViewContextType>({
  mode: 'dialog',
  setMode: () => {},
  toggle: () => {},
  isLoading: true,
})

export function DetailViewProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<DetailViewMode>('dialog')
  const [isLoading, setIsLoading] = useState(true)

  // Load preference from API on mount
  useEffect(() => {
    fetch('/api/user/preferences')
      .then(res => res.json())
      .then(data => {
        if (data.detailViewMode === 'dialog' || data.detailViewMode === 'drawer') {
          setModeState(data.detailViewMode)
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  // Persist to API (fire-and-forget)
  const setMode = useCallback((newMode: DetailViewMode) => {
    setModeState(newMode)
    fetch('/api/user/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ detailViewMode: newMode }),
    }).catch(console.error)
  }, [])

  const toggle = useCallback(() => {
    setModeState(prev => {
      const newMode = prev === 'dialog' ? 'drawer' : 'dialog'
      fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ detailViewMode: newMode }),
      }).catch(console.error)
      return newMode
    })
  }, [])

  return (
    <DetailViewContext.Provider value={{ mode, setMode, toggle, isLoading }}>
      {children}
    </DetailViewContext.Provider>
  )
}

export const useDetailViewMode = () => useContext(DetailViewContext)
