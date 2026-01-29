import prisma from '@/lib/prisma'
import { ServicesTabs } from '@/components/services-pricing/services-tabs'
import { AllServicesTable } from '@/components/services-pricing/all-services-table'
import { ServicesByService } from '@/components/services-pricing/services-by-service'
import { ServicesByClient } from '@/components/services-pricing/services-by-client'
import { ExportButton } from '@/components/services-pricing/export-button'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Services Pricing | SAAP 2026',
  description: 'Track and compare service pricing across projects and clients',
}

export default async function ServicesPricingPage() {
  const [deliverables, services, companies] = await Promise.all([
    // All deliverables with value
    prisma.deliverable.findMany({
      where: { value: { not: null } },
      select: {
        id: true,
        title: true,
        description: true,
        value: true,
        aiExtracted: true,
        project: {
          select: {
            id: true,
            title: true,
            company: { select: { id: true, name: true } },
          },
        },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    // Distinct service titles for By Service dropdown
    prisma.deliverable.groupBy({
      by: ['title'],
      where: { value: { not: null } },
      _count: { id: true },
    }),
    // Companies with deliverables for By Client dropdown
    prisma.company.findMany({
      where: {
        projects: {
          some: {
            deliverables: {
              some: { value: { not: null } },
            },
          },
        },
      },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  const serializedDeliverables = deliverables.map((d) => ({
    ...d,
    value: d.value !== null ? Number(d.value) : null,
    createdAt: d.createdAt.toISOString(),
  }))

  const serviceTitles = services.map((s) => s.title).sort()

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services Pricing</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track and compare service pricing across projects and clients
          </p>
        </div>
        <ExportButton />
      </div>

      <ServicesTabs
        allServicesContent={
          <AllServicesTable
            initialServices={serializedDeliverables}
            companies={companies}
          />
        }
        byServiceContent={<ServicesByService serviceTitles={serviceTitles} />}
        byClientContent={<ServicesByClient companies={companies} />}
      />
    </div>
  )
}
