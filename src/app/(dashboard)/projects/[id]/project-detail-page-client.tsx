'use client'

import { useRouter } from 'next/navigation'
import { ProjectDetailSheet } from '@/components/projects/project-detail-sheet'
import { Header } from '@/components/layout/header'

interface Project {
  id: string
  title: string
  description: string | null
  revenue: number | null
  potentialRevenue: number | null
  status: string
  startDate: string | null
  endDate: string | null
  isArchived?: boolean
  company: { id: string; name: string } | null
  contact: { id: string; name: string } | null
  initiative: { id: string; title: string } | null
  sourceDeal: { id: string; title: string; stageChangedAt?: string } | null
  sourcePotential: { id: string; title: string } | null
}

interface ProjectDetailPageClientProps {
  project: Project
}

export function ProjectDetailPageClient({ project }: ProjectDetailPageClientProps) {
  const router = useRouter()

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      router.push('/projects')
    }
  }

  const handleUpdate = () => {
    // Refresh the page to get updated data
    router.refresh()
  }

  const handleDelete = () => {
    router.push('/projects')
  }

  return (
    <div className="flex flex-col h-screen">
      <Header
        title={project.title}
        description={project.company?.name || 'Project Details'}
      />
      <main className="flex-1 overflow-auto">
        {/* Open detail sheet immediately */}
        <ProjectDetailSheet
          project={project}
          open={true}
          onOpenChange={handleOpenChange}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      </main>
    </div>
  )
}
