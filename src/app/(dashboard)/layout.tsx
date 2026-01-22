import { Sidebar } from '@/components/layout/sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="md:pl-64 pb-16 md:pb-0">
        {children}
      </main>
      {/* Mobile bottom navigation - added in Task 3 */}
    </div>
  )
}
