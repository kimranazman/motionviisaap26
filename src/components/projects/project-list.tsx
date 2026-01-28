'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Plus, Archive } from 'lucide-react'
import { ProjectCard } from './project-card'
import { ProjectFormModal } from './project-form-modal'
import { ProjectDetailSheet } from './project-detail-sheet'
import { PROJECT_STATUSES, type ProjectStatusId } from '@/lib/project-utils'
import { canEdit } from '@/lib/permissions'
import { cn } from '@/lib/utils'

interface Project {
  id: string
  title: string
  description: string | null
  revenue: number | null              // Actual revenue from AI invoices
  potentialRevenue: number | null     // From deal/potential conversion
  status: string
  startDate: string | null
  endDate: string | null
  isArchived?: boolean
  isInternal?: boolean
  internalEntity?: string | null
  company: { id: string; name: string } | null
  contact: { id: string; name: string } | null
  initiative: { id: string; title: string } | null
  sourceDeal: { id: string; title: string; stageChangedAt?: string } | null
  sourcePotential: { id: string; title: string } | null
}

interface ProjectListProps {
  initialData: Project[]
  initialShowArchived?: boolean
  openProjectId?: string
}

export function ProjectList({ initialData, initialShowArchived = false, openProjectId }: ProjectListProps) {
  const { data: session } = useSession()
  const userCanEdit = canEdit(session?.user?.role as never)

  const [projects, setProjects] = useState<Project[]>(initialData)
  const [selectedType, setSelectedType] = useState<'ALL' | 'CLIENT' | 'INTERNAL'>('ALL')
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatusId | 'ALL'>('ALL')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [showArchived, setShowArchived] = useState(initialShowArchived)
  const [isTogglingArchived, setIsTogglingArchived] = useState(false)

  // Handle opening project from URL param
  useEffect(() => {
    if (openProjectId) {
      const projectToOpen = initialData.find(p => p.id === openProjectId)
      if (projectToOpen) {
        setSelectedProject(projectToOpen)
        setIsDetailOpen(true)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Filter projects by type and status
  const filteredProjects = projects.filter((p) => {
    if (selectedType === 'CLIENT' && p.isInternal) return false
    if (selectedType === 'INTERNAL' && !p.isInternal) return false
    if (selectedStatus !== 'ALL' && p.status !== selectedStatus) return false
    return true
  })

  // Handle new project created
  const handleProjectCreated = (newProject: Project) => {
    setProjects((prev) => [newProject, ...prev])
  }

  // Handle project update
  const handleProjectUpdated = (updatedProject: Project) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === updatedProject.id ? updatedProject : p))
    )
  }

  // Handle project delete
  const handleProjectDeleted = (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId))
  }

  // Open detail sheet
  const handleCardClick = (project: Project) => {
    setSelectedProject(project)
    setIsDetailOpen(true)
  }

  // Status filter tabs
  const statusTabs: Array<{ id: ProjectStatusId | 'ALL'; label: string }> = [
    { id: 'ALL', label: 'All' },
    ...PROJECT_STATUSES.map((s) => ({ id: s.id as ProjectStatusId, label: s.title })),
  ]

  // Toggle archive visibility
  const handleToggleArchived = async () => {
    const newValue = !showArchived
    setIsTogglingArchived(true)
    setShowArchived(newValue)

    // Update URL
    const url = new URL(window.location.href)
    if (newValue) {
      url.searchParams.set('showArchived', 'true')
    } else {
      url.searchParams.delete('showArchived')
    }
    window.history.replaceState({}, '', url)

    // Refetch data
    try {
      const response = await fetch(`/api/projects?showArchived=${newValue}`)
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setIsTogglingArchived(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with archive toggle, filter and add button */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Left side: Archive toggle and status filter */}
        <div className="flex items-center gap-3">
          <Button
            variant={showArchived ? 'secondary' : 'ghost'}
            size="sm"
            onClick={handleToggleArchived}
            disabled={isTogglingArchived}
          >
            <Archive className="h-4 w-4 mr-1" />
            {showArchived ? 'Showing Archived' : 'Show Archived'}
          </Button>

          {/* Type filter tabs */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
            {([
              { id: 'ALL' as const, label: 'All' },
              { id: 'CLIENT' as const, label: 'Client' },
              { id: 'INTERNAL' as const, label: 'Internal' },
            ]).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  selectedType === tab.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status filter tabs */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
            {statusTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedStatus(tab.id)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  selectedStatus === tab.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Add button */}
        {userCanEdit && (
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Project
          </Button>
        )}
      </div>

      {/* Project grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {selectedStatus === 'ALL'
              ? 'No projects yet'
              : `No ${selectedStatus.toLowerCase()} projects`}
          </p>
          {userCanEdit && selectedStatus === 'ALL' && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create your first project
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => handleCardClick(project)}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      <ProjectFormModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={handleProjectCreated}
      />

      {/* Detail sheet */}
      <ProjectDetailSheet
        project={selectedProject}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onUpdate={handleProjectUpdated}
        onDelete={handleProjectDeleted}
      />
    </div>
  )
}
