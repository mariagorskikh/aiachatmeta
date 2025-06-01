'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api';

export default function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { checkAuth } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      
      if (token) {
        try {
          // Store the token
          localStorage.setItem('token', token);
          
          // Update auth state by checking auth
          await checkAuth();
          
          // Redirect to home
          router.push('/');
        } catch (err) {
          setError('Failed to complete sign in');
          setTimeout(() => router.push('/auth/login'), 2000);
        }
      } else {
        // No token, redirect to login
        router.push('/auth/login');
      }
    };

    handleCallback();
  }, [searchParams, checkAuth, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            {error ? 'Sign In Failed' : 'Completing Sign In'}
          </CardTitle>
          <CardDescription className="text-center">
            {error || 'Please wait while we complete your sign in...'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    </div>
  );
} 