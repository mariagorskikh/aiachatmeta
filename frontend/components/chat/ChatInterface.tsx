'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useChatStore } from '@/stores/chat-store';
import { AgentTone, AgentToneLabels } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function ChatInterface() {
  const [message, setMessage] = useState('');
  const [showToneSettings, setShowToneSettings] = useState(false);
  const [selectedTone, setSelectedTone] = useState<AgentTone>(AgentTone.NICER);
  const [customPrompt, setCustomPrompt] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  
  const { selectedUser, selectedConversation, selectConversation } = useChatStore();

  // Get or create conversation when user is selected
  useEffect(() => {
    if (selectedUser && !selectedConversation) {
      chatApi.getOrCreateConversation(selectedUser.id).then((conv) => {
        selectConversation(conv);
        setSelectedTone(conv.my_agent_tone);
        setCustomPrompt(conv.my_custom_prompt || '');
      });
    }
  }, [selectedUser]);

  // Fetch messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', selectedConversation?.id],
    queryFn: () => selectedConversation ? chatApi.getMessages(selectedConversation.id) : Promise.resolve([]),
    enabled: !!selectedConversation,
    refetchInterval: 2000,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => {
      if (!selectedConversation) throw new Error('No conversation selected');
      return chatApi.sendMessage(selectedConversation.id, content);
    },
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation?.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  // Update tone mutation
  const updateToneMutation = useMutation({
    mutationFn: ({ tone, customPrompt }: { tone: AgentTone; customPrompt?: string }) => {
      if (!selectedConversation) throw new Error('No conversation selected');
      return chatApi.updateTone(selectedConversation.id, tone, customPrompt);
    },
    onSuccess: () => {
      setShowToneSettings(false);
      if (selectedConversation) {
        selectConversation({
          ...selectedConversation,
          my_agent_tone: selectedTone,
          my_custom_prompt: customPrompt,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(message);
    }
  };

  const handleUpdateTone = () => {
    updateToneMutation.mutate({
      tone: selectedTone,
      customPrompt: selectedTone === AgentTone.CUSTOM ? customPrompt : undefined,
    });
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!selectedUser) {
    return (
      <Card className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Select a friend to start chatting</p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full">
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{selectedUser.username}</h2>
            <p className="text-sm text-muted-foreground">
              Agent Tone: {AgentToneLabels[selectedConversation?.my_agent_tone || AgentTone.NICER]}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowToneSettings(!showToneSettings)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {showToneSettings && (
        <div className="border-b p-4 space-y-3">
          <div>
            <label className="text-sm font-medium">Agent Tone</label>
            <Select value={selectedTone} onValueChange={(value) => setSelectedTone(value as AgentTone)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(AgentToneLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedTone === AgentTone.CUSTOM && (
            <div>
              <label className="text-sm font-medium">Custom Prompt</label>
              <Textarea
                value={customPrompt}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCustomPrompt(e.target.value)}
                placeholder="e.g., Make this message sound like a pirate"
                className="mt-1"
              />
            </div>
          )}
          
          <Button onClick={handleUpdateTone} disabled={updateToneMutation.isPending}>
            Update Tone
          </Button>
        </div>
      )}

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {isLoading && (
            <div className="text-center text-muted-foreground">
              Loading messages...
            </div>
          )}
          
          {messages.map((msg) => (
            <div key={msg.id} className={cn(
              "flex",
              msg.is_mine ? "justify-end" : "justify-start"
            )}>
              <div className={cn(
                "max-w-[70%] space-y-1",
                msg.is_mine ? "items-end" : "items-start"
              )}>
                <div className={cn(
                  "rounded-lg p-3",
                  msg.is_mine
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary"
                )}>
                  <p className="text-sm">{msg.transformed_content}</p>
                  {msg.is_mine && msg.original_content !== msg.transformed_content && (
                    <p className="text-xs opacity-70 mt-2 italic">
                      Original: {msg.original_content}
                    </p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground px-1">
                  {format(new Date(msg.timestamp), 'HH:mm')}
                </p>
              </div>
            </div>
          ))}
          
          {sendMessageMutation.isPending && (
            <div className="flex justify-end">
              <div className="bg-primary/20 rounded-lg p-3">
                <p className="text-sm text-muted-foreground">Sending...</p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSendMessage} className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={sendMessageMutation.isPending || !selectedConversation}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={!message.trim() || sendMessageMutation.isPending || !selectedConversation}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </Card>
  );
} 