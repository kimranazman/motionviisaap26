import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { UserList } from "@/components/admin/user-list"

export const metadata = {
  title: "User Management - Admin",
}

export default async function AdminUsersPage() {
  const session = await auth()

  // Defense in depth - middleware already checks this
  if (!session || session.user.role !== "ADMIN") {
    redirect("/forbidden")
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          View and manage user access and roles
        </p>
      </div>

      <UserList users={users} currentUserId={session.user.id} />
    </div>
  )
}
