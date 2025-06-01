'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { chatApi } from '@/lib/api';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, MessageCircle, Zap } from 'lucide-react';
import { useChatStore } from '@/stores/chat-store';
import { cn } from '@/lib/utils';
import { Conversation } from '@/lib/types';

interface UsersListProps {
  conversations: Conversation[];
}

export function UsersList({ conversations }: UsersListProps) {
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: chatApi.getUsers,
    refetchInterval: 30000,
  });

  const { selectedUser, selectUser, clearSelection } = useChatStore();

  const handleSelectUser = async (user: typeof users[0]) => {
    if (selectedUser?.id !== user.id) {
      clearSelection();
    }
    selectUser(user);
  };

  const getUnreadCount = (userId: string) => {
    const conversation = conversations.find(
      (c) => c.other_user.id === userId
    );
    return conversation?.unread_count || 0;
  };

  return (
    <div className="h-full backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
      {/* Header */}
      <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Connections
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {users.length} active agent{users.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="h-[calc(100%-120px)]">
        <div className="p-4 space-y-2">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                <span className="text-sm font-medium">Discovering agents...</span>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                No agents discovered yet
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Check back soon for new connections
              </p>
            </div>
          ) : (
            users.map((user, index) => {
              const unreadCount = getUnreadCount(user.id);
              const isSelected = selectedUser?.id === user.id;
              
              return (
                <div
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className={cn(
                    "group relative flex items-center space-x-4 p-4 rounded-xl transition-all duration-300 cursor-pointer transform hover:scale-[1.02]",
                    isSelected
                      ? "bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 dark:border-blue-400/20 shadow-lg"
                      : "hover:bg-white/60 dark:hover:bg-gray-800/60 hover:shadow-md"
                  )}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Avatar */}
                  <div className="relative">
                    <Avatar className={cn(
                      "h-12 w-12 transition-all duration-300",
                      isSelected ? "ring-2 ring-blue-500/50 ring-offset-2 ring-offset-white dark:ring-offset-gray-900" : ""
                    )}>
                      <AvatarFallback className={cn(
                        "text-sm font-semibold transition-all duration-300",
                        isSelected 
                          ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white" 
                          : "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-600 dark:text-gray-300"
                      )}>
                        {user.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Online indicator */}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse"></div>
                  </div>

                  {/* User info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className={cn(
                        "font-semibold truncate transition-colors duration-300",
                        isSelected 
                          ? "text-gray-900 dark:text-gray-100" 
                          : "text-gray-700 dark:text-gray-200"
                      )}>
                        {user.username}
                      </h3>
                      {isSelected && (
                        <Zap className="h-3 w-3 text-blue-500 animate-pulse" />
                      )}
                    </div>
                    <p className={cn(
                      "text-xs transition-colors duration-300 truncate",
                      isSelected 
                        ? "text-blue-600 dark:text-blue-400" 
                        : "text-gray-500 dark:text-gray-400"
                    )}>
                      {isSelected ? "Active conversation" : "Tap to connect"}
                    </p>
                  </div>

                  {/* Status indicators */}
                  <div className="flex items-center space-x-2">
                    {unreadCount > 0 && (
                      <div className="relative">
                        <div className="w-6 h-6 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        </div>
                        <div className="absolute inset-0 w-6 h-6 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-ping opacity-20"></div>
                      </div>
                    )}
                    
                    {isSelected && (
                      <div className="p-1.5 bg-blue-500/20 rounded-lg">
                        <MessageCircle className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                      </div>
                    )}
                  </div>

                  {/* Hover glow effect */}
                  <div className={cn(
                    "absolute inset-0 rounded-xl transition-opacity duration-300 pointer-events-none",
                    "bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100"
                  )} />
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
} 