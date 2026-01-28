import prisma from '@/lib/prisma'
import { ContactList } from '@/components/contacts/contact-list'

export const dynamic = 'force-dynamic'

export default async function ContactsPage() {
  const contacts = await prisma.contact.findMany({
    include: {
      company: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
      _count: {
        select: { deals: true, potentials: true, projects: true },
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
        <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
        <p className="text-sm text-gray-500 mt-1">
          Browse and manage contacts across all companies
        </p>
      </div>
      <ContactList initialData={contacts} companies={companies} />
    </div>
  )
}
