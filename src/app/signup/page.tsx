import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Logo, GoogleIcon } from "@/components/icons"
import Link from "next/link"

export default function SignupPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="mx-auto max-w-sm w-full shadow-2xl">
        <CardHeader className="space-y-4 text-center">
            <div className="inline-flex items-center justify-center gap-2">
                <Logo className="h-8 w-8 text-primary" />
                <CardTitle className="text-3xl font-headline">LitManager</CardTitle>
            </div>
          <CardDescription>
            Create your LitManager account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="John Doe" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required />
            </div>
            <Link href="/" className="w-full">
              <Button type="submit" className="w-full">
                Create Account
              </Button>
            </Link>
            <Button variant="outline" className="w-full">
              <GoogleIcon className="mr-2 h-4 w-4" />
              Sign up with Google
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
