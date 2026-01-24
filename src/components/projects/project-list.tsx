'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
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
  company: { id: string; name: string } | null
  contact: { id: string; name: string } | null
  initiative: { id: string; title: string } | null
  sourceDeal: { id: string; title: string; stageChangedAt?: string } | null
  sourcePotential: { id: string; title: string } | null
}

interface ProjectListProps {
  initialData: Project[]
}

export function ProjectList({ initialData }: ProjectListProps) {
  const { data: session } = useSession()
  const userCanEdit = canEdit(session?.user?.role as never)

  const [projects, setProjects] = useState<Project[]>(initialData)
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatusId | 'ALL'>('ALL')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Filter projects by selected status
  const filteredProjects =
    selectedStatus === 'ALL'
      ? projects
      : projects.filter((p) => p.status === selectedStatus)

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

  return (
    <div className="space-y-6">
      {/* Header with filter and add button */}
      <div className="flex items-center justify-between">
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
