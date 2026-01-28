'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table2 as TableIcon, KanbanSquare } from 'lucide-react'
import { ProjectList } from './project-list'
import { ProjectsKanbanBoard } from './projects-kanban-board'
import { ProjectDetailSheet } from './project-detail-sheet'
import type { ProjectForKanban } from './project-kanban-card'

// Re-export for convenience
export type { ProjectForKanban }

// Extended type for page client (includes list-specific fields)
export interface ProjectForPage extends ProjectForKanban {
  description: string | null
  contact: { id: string; name: string } | null
  potentialRevenue: number | null
  sourceDeal: { id: string; title: string; stageChangedAt?: string } | null
  sourcePotential: { id: string; title: string } | null
  initiative: { id: string; title: string } | null
  isArchived?: boolean
}

interface ProjectsPageClientProps {
  initialData: ProjectForPage[]
  initialShowArchived: boolean
  openProjectId?: string
}

const STORAGE_KEY = 'projects-view-preference'

export function ProjectsPageClient({
  initialData,
  initialShowArchived,
  openProjectId,
}: ProjectsPageClientProps) {
  // View state
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')

  // Project state for kanban
  const [projects, setProjects] = useState<ProjectForPage[]>(initialData)

  // Detail sheet state (for kanban view)
  const [selectedProject, setSelectedProject] = useState<ProjectForPage | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  // Load view preference from localStorage (SSR-safe)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'list' || stored === 'kanban') {
        setViewMode(stored)
      }
    } catch {
      /* ignore */
    }
  }, [])

  // Persist view preference
  const handleViewChange = (mode: string) => {
    const validMode = mode as 'list' | 'kanban'
    setViewMode(validMode)
    try {
      localStorage.setItem(STORAGE_KEY, validMode)
    } catch {
      /* ignore */
    }
  }

  // Handle project click (kanban - opens detail sheet)
  const handleProjectClick = (project: ProjectForKanban) => {
    const fullProject = projects.find(p => p.id === project.id)
    if (fullProject) {
      setSelectedProject(fullProject)
      setIsSheetOpen(true)
    }
  }

  // Handle projects change (from kanban drag)
  const handleProjectsChange = (updatedProjects: ProjectForKanban[]) => {
    // Merge updates back into full projects array
    setProjects(prev => prev.map(p => {
      const updated = updatedProjects.find(u => u.id === p.id)
      return updated ? { ...p, status: updated.status } : p
    }))
  }

  // Handle project update from detail sheet
  // The sheet returns its own Project type, so we merge with our extended data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleProjectUpdated = (updatedProject: any) => {
    setProjects(prev =>
      prev.map(p => {
        if (p.id === updatedProject.id) {
          // Merge: keep our kanban fields, update from sheet
          return {
            ...p,
            ...updatedProject,
            taskCount: p.taskCount,
            taskDoneCount: p.taskDoneCount,
            totalCost: p.totalCost,
          }
        }
        return p
      })
    )
    // Update selected project maintaining kanban fields
    if (selectedProject) {
      setSelectedProject({
        ...selectedProject,
        ...updatedProject,
        taskCount: selectedProject.taskCount,
        taskDoneCount: selectedProject.taskDoneCount,
        totalCost: selectedProject.totalCost,
      })
    }
  }

  // Handle project delete from detail sheet
  const handleProjectDeleted = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId))
    setIsSheetOpen(false)
    setSelectedProject(null)
  }

  return (
    <div className="space-y-4">
      {/* View Toggle (top right aligned) */}
      <div className="flex justify-end">
        <Tabs value={viewMode} onValueChange={handleViewChange}>
          <TabsList className="bg-white/70 backdrop-blur-xl border border-gray-200/50">
            <TabsTrigger value="list" className="gap-1.5 data-[state=active]:bg-white">
              <TableIcon className="h-4 w-4" />
              List
            </TabsTrigger>
            <TabsTrigger value="kanban" className="gap-1.5 data-[state=active]:bg-white">
              <KanbanSquare className="h-4 w-4" />
              Kanban
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <ProjectList
          initialData={projects}
          initialShowArchived={initialShowArchived}
          openProjectId={openProjectId}
        />
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <ProjectsKanbanBoard
          projects={projects}
          onProjectClick={handleProjectClick}
          onProjectsChange={handleProjectsChange}
        />
      )}

      {/* Detail Sheet (for kanban view clicks) */}
      {viewMode === 'kanban' && selectedProject && (
        <ProjectDetailSheet
          project={selectedProject}
          open={isSheetOpen}
          onOpenChange={setIsSheetOpen}
          onUpdate={handleProjectUpdated}
          onDelete={handleProjectDeleted}
        />
      )}
    </div>
  )
}
