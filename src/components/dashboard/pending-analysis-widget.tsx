'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  FileText,
  ReceiptText,
  Building2,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface ProjectPending {
  id: string
  title: string
  company: string
  pendingInvoices: number
  pendingReceipts: number
  hasManifest: boolean
}

interface PendingData {
  totalPending: number
  projects: ProjectPending[]
  claudeCommand: string
}

export function PendingAnalysisWidget() {
  const [data, setData] = useState<PendingData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCopied, setIsCopied] = useState(false)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/pending')
      if (!response.ok) {
        throw new Error('Failed to fetch pending analysis data')
      }
      const result = await response.json()
      setData(result)
    } catch (err) {
      console.error('Failed to fetch pending analysis:', err)
      setError('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCopyCommand = async () => {
    if (!data?.claudeCommand) return

    try {
      await navigator.clipboard.writeText(data.claudeCommand)
      setIsCopied(true)
      toast.success('Command copied to clipboard')
      setTimeout(() => setIsCopied(false), 2000)
    } catch {
      toast.error('Failed to copy command')
    }
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-2">
        <p className="text-sm text-red-500">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    )
  }

  if (!data) return null

  const totalInvoices = data.projects.reduce((sum, p) => sum + p.pendingInvoices, 0)
  const totalReceipts = data.projects.reduce((sum, p) => sum + p.pendingReceipts, 0)

  return (
    <div className="h-full flex flex-col">
      {/* Summary */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-100 rounded-lg p-2">
            <Sparkles className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">
              {data.totalPending}
            </div>
            <div className="text-xs text-gray-500">pending analysis</div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchData}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Breakdown */}
      <div className="flex items-center gap-3 mb-4">
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <FileText className="mr-1 h-3 w-3" />
          {totalInvoices} invoice{totalInvoices !== 1 ? 's' : ''}
        </Badge>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <ReceiptText className="mr-1 h-3 w-3" />
          {totalReceipts} receipt{totalReceipts !== 1 ? 's' : ''}
        </Badge>
      </div>

      <Separator className="mb-4" />

      {data.totalPending === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="bg-green-100 rounded-full p-3 mb-3">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <p className="text-sm font-medium text-gray-700">All caught up!</p>
          <p className="text-xs text-gray-500">No documents pending AI analysis</p>
        </div>
      ) : (
        <>
          {/* Projects with pending docs */}
          <ScrollArea className="flex-1 -mx-2 px-2">
            <div className="space-y-2">
              {data.projects.slice(0, 5).map((project) => (
                <Card key={project.id} className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate">{project.title}</div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Building2 className="h-3 w-3" />
                        {project.company || 'Internal'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {project.pendingInvoices > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {project.pendingInvoices} inv
                        </Badge>
                      )}
                      {project.pendingReceipts > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {project.pendingReceipts} rec
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {data.projects.length > 5 && (
              <Link
                href="/projects"
                className="flex items-center justify-center gap-1 mt-3 text-xs text-blue-600 hover:text-blue-700"
              >
                View all {data.projects.length} projects
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </ScrollArea>

          <Separator className="my-4" />

          {/* Claude command */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-500">Run Claude command:</div>
            <div className="relative">
              <CardContent className="p-2 bg-gray-900 rounded-md">
                <code className="text-xs text-gray-100 font-mono block truncate">
                  {data.claudeCommand}
                </code>
              </CardContent>
              <Button
                variant="secondary"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7"
                onClick={handleCopyCommand}
              >
                {isCopied ? (
                  <>
                    <Check className="mr-1 h-3 w-3" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-1 h-3 w-3" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
