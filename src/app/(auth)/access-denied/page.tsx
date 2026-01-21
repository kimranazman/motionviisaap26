import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldX } from "lucide-react"

export default function AccessDeniedPage() {
  return (
    <Card className="w-full max-w-md mx-4 text-center">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <ShieldX className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Access Denied</CardTitle>
        <CardDescription>
          Your account is not authorized to access this application.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Only <span className="font-medium">@talenta.com.my</span> email addresses are allowed.
          Please sign in with your Talenta work account.
        </p>

        <Button asChild variant="outline" className="w-full">
          <Link href="/login">Try Another Account</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
