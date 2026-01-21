"use client"

import { useState, useTransition } from "react"
import { UserRole } from "@prisma/client"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateUserRole } from "@/lib/actions/user-actions"

interface UserRoleSelectProps {
  userId: string
  currentRole: UserRole
  disabled?: boolean
}

const ROLE_OPTIONS = [
  { value: "VIEWER", label: "Viewer" },
  { value: "EDITOR", label: "Editor" },
  { value: "ADMIN", label: "Admin" },
]

export function UserRoleSelect({
  userId,
  currentRole,
  disabled,
}: UserRoleSelectProps) {
  const [isPending, startTransition] = useTransition()
  const [optimisticRole, setOptimisticRole] = useState(currentRole)

  const handleRoleChange = (newRole: UserRole) => {
    setOptimisticRole(newRole) // Optimistic update
    startTransition(async () => {
      const result = await updateUserRole(userId, newRole)
      if ("error" in result) {
        setOptimisticRole(currentRole) // Revert on error
      }
    })
  }

  return (
    <Select
      value={optimisticRole}
      onValueChange={(value) => handleRoleChange(value as UserRole)}
      disabled={disabled || isPending}
    >
      <SelectTrigger className="w-[120px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ROLE_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
