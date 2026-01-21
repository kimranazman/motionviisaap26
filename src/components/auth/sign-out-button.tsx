"use client"

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

interface SignOutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  showIcon?: boolean
  children?: React.ReactNode
}

export function SignOutButton({
  variant = "ghost",
  size = "default",
  className,
  showIcon = true,
  children,
}: SignOutButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      {showIcon && <LogOut className="h-4 w-4 mr-2" />}
      {children ?? "Sign out"}
    </Button>
  )
}
