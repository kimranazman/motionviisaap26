import prisma from '@/lib/prisma'
import { DepartmentList } from '@/components/departments/department-list'

export const dynamic = 'force-dynamic'

export default async function DepartmentsPage() {
  const departments = await prisma.department.findMany({
    include: {
      company: { select: { id: true, name: true } },
      _count: {
        select: { contacts: true, deals: true, potentials: true },
      },
    },
    orderBy: [{ company: { name: 'asc' } }, { name: 'asc' }],
  })

  // Get companies for filter dropdown
  const companies = await prisma.company.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
        <p className="text-sm text-gray-500 mt-1">
          Browse and manage departments across all companies
        </p>
      </div>
      <DepartmentList initialData={departments} companies={companies} />
    </div>
  )
}
