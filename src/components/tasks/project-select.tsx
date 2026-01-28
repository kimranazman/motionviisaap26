'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
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

interface Project {
  id: string
  title: string
}

interface ProjectSelectProps {
  value: string | null
  onValueChange: (projectId: string | null) => void
  projects: Project[]
  disabled?: boolean
}

export function ProjectSelect({
  value,
  onValueChange,
  projects,
  disabled = false,
}: ProjectSelectProps) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const selectedProject = projects.find((p) => p.id === value)

  const filteredProjects = projects.filter((project) =>
    project.title.toLowerCase().includes(inputValue.toLowerCase())
  )

  const handleSelect = (projectId: string) => {
    onValueChange(projectId === value ? null : projectId)
    setOpen(false)
    setInputValue('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal',
            !value && 'text-muted-foreground'
          )}
        >
          {selectedProject?.title || 'Select project...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            value={inputValue}
            onValueChange={setInputValue}
            placeholder="Search projects..."
          />
          <CommandList>
            {filteredProjects.length === 0 ? (
              <CommandEmpty>No projects found.</CommandEmpty>
            ) : null}
            <CommandGroup>
              {filteredProjects.map((project) => (
                <CommandItem
                  key={project.id}
                  value={project.id}
                  onSelect={() => handleSelect(project.id)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === project.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {project.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
