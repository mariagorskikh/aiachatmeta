'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { chatApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, MessageCircle } from 'lucide-react';
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
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Friends
        </CardTitle>
        <CardDescription>
          Click on a friend to start chatting
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="p-4 space-y-2">
            {isLoading ? (
              <p className="text-center text-muted-foreground py-4">
                Loading friends...
              </p>
            ) : users.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No other users yet
              </p>
            ) : (
              users.map((user) => {
                const unreadCount = getUnreadCount(user.id);
                return (
                  <div
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer",
                      selectedUser?.id === user.id
                        ? "bg-primary/10 border border-primary/20"
                        : "hover:bg-accent"
                    )}
                  >
                    <Avatar>
                      <AvatarFallback>
                        {user.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{user.username}</p>
                      <p className="text-xs text-muted-foreground">
                        Click to chat
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <span className="bg-destructive text-destructive-foreground rounded-full h-5 px-1.5 text-xs flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                      {selectedUser?.id === user.id && (
                        <MessageCircle className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 