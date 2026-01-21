"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@prisma/client"
import { revalidatePath } from "next/cache"

type ActionResult = { success: true } | { error: string }

export async function updateUserRole(
  userId: string,
  newRole: UserRole
): Promise<ActionResult> {
  const session = await auth()

  if (!session || session.user.role !== "ADMIN") {
    console.log("[ADMIN] Unauthorized attempt to update user role")
    return { error: "Unauthorized" }
  }

  if (session.user.id === userId) {
    console.log("[ADMIN] Blocked self-role-change attempt:", session.user.email)
    return { error: "You cannot change your own role" }
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
      select: { email: true },
    })

    console.log(
      `[ADMIN] ${session.user.email} changed ${user.email} role to ${newRole}`
    )

    revalidatePath("/admin/users")
    return { success: true }
  } catch (error) {
    console.error("[ADMIN] Failed to update user role:", error)
    return { error: "Failed to update user role" }
  }
}

export async function deleteUser(userId: string): Promise<ActionResult> {
  const session = await auth()

  if (!session || session.user.role !== "ADMIN") {
    console.log("[ADMIN] Unauthorized attempt to delete user")
    return { error: "Unauthorized" }
  }

  if (session.user.id === userId) {
    console.log("[ADMIN] Blocked self-deletion attempt:", session.user.email)
    return { error: "You cannot delete your own account" }
  }

  try {
    const user = await prisma.user.delete({
      where: { id: userId },
      select: { email: true },
    })

    console.log(`[ADMIN] ${session.user.email} deleted user ${user.email}`)

    revalidatePath("/admin/users")
    return { success: true }
  } catch (error) {
    console.error("[ADMIN] Failed to delete user:", error)
    return { error: "Failed to delete user" }
  }
}
