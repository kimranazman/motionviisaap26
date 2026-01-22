import prisma from '@/lib/prisma'
import { CompanyList } from '@/components/companies/company-list'

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; industry?: string }>
}) {
  const { search, industry } = await searchParams

  const companies = await prisma.company.findMany({
    where: {
      AND: [
        search ? { name: { contains: search } } : {},
        industry ? { industry } : {},
      ],
    },
    include: {
      _count: {
        select: { contacts: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your client companies and contacts
        </p>
      </div>
      <CompanyList initialData={companies} />
    </div>
  )
}
