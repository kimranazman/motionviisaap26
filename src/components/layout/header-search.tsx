'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useDebounce } from '@/lib/hooks/use-debounce'
import { getStatusColor, formatStatus, formatTeamMember } from '@/lib/utils'

interface SearchResult {
  id: string
  title: string
  status: string
  personInCharge: string | null
}

export function HeaderSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const debouncedQuery = useDebounce(query, 300)

  // Fetch search results when debounced query changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([])
      setIsOpen(false)
      return
    }

    const searchInitiatives = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(
          `/api/initiatives/search?q=${encodeURIComponent(debouncedQuery)}`
        )
        if (response.ok) {
          const data = await response.json()
          setResults(data)
          setIsOpen(data.length > 0 || debouncedQuery.trim().length > 0)
        }
      } catch (error) {
        console.error('Search failed:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    searchInitiatives()
  }, [debouncedQuery])

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  // Handle result click - close popover
  const handleResultClick = () => {
    setIsOpen(false)
    setQuery('')
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search initiatives..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (results.length > 0 || (query.trim() && debouncedQuery.trim())) {
                setIsOpen(true)
              }
            }}
            className="w-64 pl-9 bg-gray-50 border-gray-200"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <ScrollArea className="max-h-80">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-gray-500">
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              No results for &quot;{debouncedQuery}&quot;
            </div>
          ) : (
            <div className="p-1">
              {results.map((result) => (
                <Link
                  key={result.id}
                  href={`/initiatives/${result.id}`}
                  onClick={handleResultClick}
                  className="flex items-center gap-2 p-2 rounded hover:bg-gray-100"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{result.title}</p>
                    <p className="text-xs text-gray-500">{formatTeamMember(result.personInCharge)}</p>
                  </div>
                  <Badge className={getStatusColor(result.status)}>
                    {formatStatus(result.status)}
                  </Badge>
                </Link>
              ))}
              {results.length > 0 && (
                <div className="px-2 py-1.5 text-xs text-gray-400 border-t mt-1">
                  {results.length} result{results.length !== 1 ? 's' : ''} found
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
