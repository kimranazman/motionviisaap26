'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from '@/components/ui/dialog'
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

interface HeaderSearchProps {
  mobile?: boolean
}

export function HeaderSearch({ mobile = false }: HeaderSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const debouncedQuery = useDebounce(query, 300)

  // Fetch search results when debounced query changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([])
      if (!mobile) setIsOpen(false)
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
          if (!mobile) {
            setIsOpen(data.length > 0 || debouncedQuery.trim().length > 0)
          }
        }
      } catch (error) {
        console.error('Search failed:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    searchInitiatives()
  }, [debouncedQuery, mobile])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const handleResultClick = () => {
    setIsOpen(false)
    setQuery('')
  }

  const SearchResults = () => (
    <ScrollArea className="max-h-80">
      {isLoading ? (
        <div className="p-4 text-center text-sm text-gray-500">
          Searching...
        </div>
      ) : results.length === 0 && debouncedQuery.trim() ? (
        <div className="p-4 text-center text-sm text-gray-500">
          No results for &quot;{debouncedQuery}&quot;
        </div>
      ) : results.length === 0 ? (
        <div className="p-4 text-center text-sm text-gray-500">
          Type to search initiatives...
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
  )

  // Mobile: Dialog with search input
  if (mobile) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon">
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="top-4 translate-y-0 max-w-[calc(100%-2rem)] p-4">
          <DialogTitle className="sr-only">Search initiatives</DialogTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search initiatives..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              className="pl-9 bg-gray-50 border-gray-200"
            />
          </div>
          <SearchResults />
        </DialogContent>
      </Dialog>
    )
  }

  // Desktop: Popover with search input (existing behavior)
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
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
        <SearchResults />
      </PopoverContent>
    </Popover>
  )
}
