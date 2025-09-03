
'use client';
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
import * as React from 'react';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, updateProfile } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { doc, setDoc } from "firebase/firestore";

export default function SignupPage() {
    const [name, setName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const router = useRouter();
    const { toast } = useToast();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            await updateProfile(user, { displayName: name });
            
            // Create a customer entry in Firestore
            await setDoc(doc(db, "customers", user.uid), {
                id: user.uid,
                name: name,
                email: email,
                joinDate: new Date().toISOString().split('T')[0],
                totalOrders: 0,
                totalSpent: 0,
                address: '',
                isAdmin: false,
            });

            router.push('/');
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Sign-up Failed',
                description: error.message,
            });
        }
    };
    
    const handleGoogleSignIn = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            
            // Create a customer entry in Firestore
            await setDoc(doc(db, "customers", user.uid), {
                id: user.uid,
                name: user.displayName,
                email: user.email,
                joinDate: new Date().toISOString().split('T')[0],
                totalOrders: 0,
                totalSpent: 0,
                address: '', // Google sign-in doesn't provide address
                isAdmin: false,
            }, { merge: true }); // Merge to avoid overwriting if user already exists from email signup

            router.push('/');
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Google Sign-In Failed',
                description: error.message,
            });
        }
    }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="mx-auto max-w-sm w-full shadow-2xl">
        <CardHeader className="space-y-4 text-center">
            <div className="inline-flex items-center justify-center gap-2">
                <Logo className="h-8 w-8 text-primary" />
                <CardTitle className="text-3xl font-headline">Bookstore</CardTitle>
            </div>
          <CardDescription>
            Create your Bookstore account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input 
                    id="name" 
                    placeholder="John Doe" 
                    required 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                    id="password" 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full">
                Create Account
              </Button>
            </div>
          </form>
          <Button variant="outline" className="w-full mt-4" onClick={handleGoogleSignIn}>
            <GoogleIcon className="mr-2 h-4 w-4" />
            Sign up with Google
          </Button>
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
