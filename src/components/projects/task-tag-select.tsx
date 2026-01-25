'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, Plus, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { TAG_COLORS, type TagColor } from '@/lib/tag-utils'

interface Tag {
  id: string
  name: string
  color: string
}

interface SelectedTag {
  tag: Tag
  inherited: boolean
}

interface TaskTagSelectProps {
  taskId: string
  projectId: string
  selectedTags: SelectedTag[]
  onTagsChange: () => void
}

export function TaskTagSelect({
  taskId,
  projectId,
  selectedTags,
  onTagsChange,
}: TaskTagSelectProps) {
  const [open, setOpen] = useState(false)
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [query, setQuery] = useState('')

  // Create tag dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState<TagColor>(TAG_COLORS[0])
  const [isCreating, setIsCreating] = useState(false)

  // Fetch all tags when popover opens (lazy load)
  useEffect(() => {
    if (open && tags.length === 0) {
      fetchTags()
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTags = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/tags')
      if (response.ok) {
        const data = await response.json()
        setTags(data)
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter tags based on search query
  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(query.toLowerCase())
  )

  // Check if current query matches any existing tag name exactly
  const queryMatchesExisting = tags.some(
    tag => tag.name.toLowerCase() === query.toLowerCase()
  )

  // Get selected tag IDs for checking
  const selectedTagIds = new Set(selectedTags.map(st => st.tag.id))

  const handleToggleTag = async (tag: Tag) => {
    const isSelected = selectedTagIds.has(tag.id)

    // TODO: Implement in Plan 33-03
    // if (isSelected) {
    //   // Remove tag: DELETE /api/projects/[id]/tasks/[taskId]/tags/[tagId]
    // } else {
    //   // Add tag: POST /api/projects/[id]/tasks/[taskId]/tags with { tagId }
    // }

    console.log(`TODO: ${isSelected ? 'Remove' : 'Add'} tag ${tag.id} ${isSelected ? 'from' : 'to'} task ${taskId} in project ${projectId}`)

    // For now, just call onTagsChange to refresh
    onTagsChange()
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return

    setIsCreating(true)
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTagName.trim(),
          color: newTagColor,
        }),
      })

      if (response.ok) {
        const newTag = await response.json()
        setTags(prev => [...prev, newTag].sort((a, b) => a.name.localeCompare(b.name)))
        setShowCreateDialog(false)
        setNewTagName('')
        setNewTagColor(TAG_COLORS[0])

        // Automatically add the new tag to the task
        // TODO: Implement in Plan 33-03
        // POST /api/projects/[id]/tasks/[taskId]/tags with { tagId: newTag.id }
        console.log(`TODO: Add new tag ${newTag.id} to task ${taskId}`)
        onTagsChange()
      } else {
        const error = await response.json()
        console.error('Failed to create tag:', error)
      }
    } catch (error) {
      console.error('Error creating tag:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const openCreateDialog = () => {
    setNewTagName(query)
    setShowCreateDialog(true)
    setOpen(false)
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="justify-between font-normal"
            size="sm"
          >
            <span className="flex items-center gap-1">
              {selectedTags.length > 0 ? (
                <span className="text-muted-foreground">
                  {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''}
                </span>
              ) : (
                <span className="text-muted-foreground">Add tags...</span>
              )}
            </span>
            <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder="Search tags..."
            />
            <CommandList>
              {isLoading ? (
                <CommandEmpty>Loading...</CommandEmpty>
              ) : filteredTags.length === 0 && !query ? (
                <CommandEmpty>No tags yet.</CommandEmpty>
              ) : filteredTags.length === 0 && query ? (
                <CommandEmpty>No matching tags.</CommandEmpty>
              ) : null}

              <CommandGroup>
                {filteredTags.map((tag) => {
                  const isSelected = selectedTagIds.has(tag.id)
                  const selectedTag = selectedTags.find(st => st.tag.id === tag.id)
                  const isInherited = selectedTag?.inherited ?? false

                  return (
                    <CommandItem
                      key={tag.id}
                      value={tag.id}
                      onSelect={() => !isInherited && handleToggleTag(tag)}
                      disabled={isInherited}
                      className={cn(isInherited && 'opacity-50 cursor-not-allowed')}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <div
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="truncate">{tag.name}</span>
                        {isInherited && (
                          <Lock className="h-3 w-3 text-muted-foreground ml-auto" />
                        )}
                      </div>
                      {isSelected && !isInherited && (
                        <Check className="h-4 w-4 ml-2" />
                      )}
                    </CommandItem>
                  )
                })}
              </CommandGroup>

              {/* Create new tag option */}
              {query.trim() && !queryMatchesExisting && (
                <CommandGroup>
                  <CommandItem
                    onSelect={openCreateDialog}
                    className="text-primary"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create &quot;{query}&quot;
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected tags display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {selectedTags.map(({ tag, inherited }) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="text-xs flex items-center gap-1"
              style={{
                backgroundColor: `${tag.color}20`,
                borderColor: tag.color,
                color: tag.color,
              }}
            >
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              {tag.name}
              {inherited && <Lock className="h-2.5 w-2.5" />}
            </Badge>
          ))}
        </div>
      )}

      {/* Create tag dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader>
            <DialogTitle>Create New Tag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tag-name">Name</Label>
              <Input
                id="tag-name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Tag name"
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {TAG_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewTagColor(color)}
                    className={cn(
                      'h-8 w-8 rounded-full transition-all',
                      newTagColor === color && 'ring-2 ring-offset-2 ring-primary'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTag}
              disabled={!newTagName.trim() || isCreating}
            >
              {isCreating ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
