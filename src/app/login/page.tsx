'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, tier: 'champion' }), // Auto-grant champion tier for now
      });

      if (res.ok) {
        router.refresh();
        router.push('/');
      }
    } catch (error) {
      console.error('Login failed', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome Back! 👋</h1>
          <p className="mt-2 text-slate-600">Sign in to play games and chat with friends.</p>
        </div>

        <Card className="border-2 border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your username or email (any text works for demo).</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-900">
                  Username
                </label>
                <Input
                  id="email"
                  placeholder="CoolKid123"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 text-lg"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 text-lg font-semibold bg-sky-500 hover:bg-sky-400"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Let\'s Play! 🚀'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-slate-500">
          <Link href="/" className="font-medium text-sky-600 hover:underline">
            ← Back to Home
          </Link>
        </p>
      </div>
    </main>
  );
}

