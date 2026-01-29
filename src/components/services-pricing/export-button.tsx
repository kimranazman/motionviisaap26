'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

export function ExportButton() {
  const handleExport = () => {
    window.location.href = '/api/services-pricing/export'
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      <Download className="h-4 w-4 mr-2" />
      Export
    </Button>
  )
}
