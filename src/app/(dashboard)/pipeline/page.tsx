import { Header } from '@/components/layout/header'
import { PipelineBoard } from '@/components/pipeline/pipeline-board'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function PipelinePage() {
  const deals = await prisma.deal.findMany({
    include: {
      company: {
        select: { id: true, name: true },
      },
      contact: {
        select: { id: true, name: true },
      },
    },
    orderBy: [
      { stage: 'asc' },
      { position: 'asc' },
    ],
  })

  // Transform Decimal values to numbers for client component
  const serializedDeals = deals.map(deal => ({
    ...deal,
    value: deal.value ? Number(deal.value) : null,
  }))

  return (
    <div className="flex flex-col h-screen">
      <Header
        title="Sales Pipeline"
        description="Track deals through stages"
      />
      <main className="flex-1 overflow-auto p-6">
        <PipelineBoard initialData={serializedDeals} />
      </main>
    </div>
  )
}
