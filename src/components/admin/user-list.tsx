"use client"

import { UserRole } from "@prisma/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { UserRoleSelect } from "./user-role-select"
import { DeleteUserButton } from "./delete-user-button"
import { formatDistanceToNow } from "date-fns"

interface User {
  id: string
  name: string | null
  email: string | null
  image: string | null
  role: UserRole
  createdAt: Date
}

interface UserListProps {
  users: User[]
  currentUserId: string
}

function getRoleBadgeVariant(role: UserRole) {
  switch (role) {
    case "ADMIN":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400"
    case "EDITOR":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
    case "VIEWER":
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
  }
}

function getInitials(name: string | null): string {
  if (!name) return "?"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function UserList({ users, currentUserId }: UserListProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const isCurrentUser = user.id === currentUserId
              return (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.image ?? undefined} />
                        <AvatarFallback>
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {user.name ?? "Unknown"}
                          {isCurrentUser && (
                            <Badge variant="outline" className="ml-2">
                              You
                            </Badge>
                          )}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <UserRoleSelect
                      userId={user.id}
                      currentRole={user.role}
                      disabled={isCurrentUser}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDistanceToNow(user.createdAt, { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <DeleteUserButton
                      userId={user.id}
                      userEmail={user.email ?? "this user"}
                      disabled={isCurrentUser}
                    />
                  </TableCell>
                </TableRow>
              )
            })}

            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <p className="text-muted-foreground">No users found</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      <div className="px-4 py-3 border-t text-sm text-muted-foreground">
        {users.length} user{users.length !== 1 ? "s" : ""} total
      </div>
    </Card>
  )
}
