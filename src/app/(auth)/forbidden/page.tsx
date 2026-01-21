import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldAlert } from "lucide-react"

export default function ForbiddenPage() {
  return (
    <Card className="w-full max-w-md mx-4 text-center">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Access Forbidden</CardTitle>
        <CardDescription>
          You don&apos;t have permission to access this page.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This area is restricted to administrators only. Contact your admin
          if you believe this is an error.
        </p>

        <Button asChild variant="outline" className="w-full">
          <Link href="/">Return to Dashboard</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
