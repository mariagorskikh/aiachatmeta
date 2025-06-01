'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useQuery } from '@tanstack/react-query';
import { chatApi } from '@/lib/api';
import { useChatStore } from '@/stores/chat-store';
import ChatInterface from '@/components/chat/ChatInterface';
import { UsersList } from '@/components/chat/UsersList';
import { Button } from '@/components/ui/button';
import { LogOut, MessageSquare, Sparkles } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { user, logout, checkAuth, isLoading } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  // Fetch conversations - don't use setConversations, just pass them as needed
  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: chatApi.getConversations,
    enabled: !!user,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto animation-delay-75"></div>
          </div>
          <p className="mt-6 text-gray-600 dark:text-gray-300 font-medium">Initializing AIA Chat...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/20">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse animation-delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-400/5 to-purple-400/5 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <MessageSquare className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  <Sparkles className="h-3 w-3 text-purple-500 absolute -top-1 -right-1 animate-pulse" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    AIA Chat
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    Agent Intelligence
                  </p>
                </div>
              </div>
            </div>
            
            {/* Welcome Section */}
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Welcome back,</span>
                  <span className="text-lg font-semibold bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-200 dark:to-gray-100 bg-clip-text text-transparent">
                    {user.username}
                  </span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500">Ready for intelligent conversations</p>
              </div>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={logout}
                className="hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[calc(100vh-140px)]">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <UsersList conversations={conversations} />
          </div>
          
          {/* Chat Area */}
          <div className="lg:col-span-3">
            <ChatInterface />
          </div>
        </div>
      </main>
    </div>
  );
} 