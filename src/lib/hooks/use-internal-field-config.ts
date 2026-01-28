'use client'

import { useState, useEffect } from 'react'
import { DEFAULT_INTERNAL_FIELD_CONFIG, type InternalFieldConfig, type InternalFieldKey } from '@/types/internal-fields'

export function useInternalFieldConfig() {
  const [config, setConfig] = useState<InternalFieldConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/admin/internal-fields')
        if (response.ok) {
          const data = await response.json()
          setConfig(data.internalFieldConfig)
        }
      } catch (error) {
        console.error('Failed to fetch internal field config:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchConfig()
  }, [])

  /** Check if a field should be hidden for internal projects */
  const isHidden = (fieldKey: InternalFieldKey, isInternal: boolean): boolean => {
    if (!isInternal) return false
    const effectiveConfig = config ?? DEFAULT_INTERNAL_FIELD_CONFIG
    return effectiveConfig.hiddenFields.includes(fieldKey)
  }

  return { config, isLoading, isHidden }
}
