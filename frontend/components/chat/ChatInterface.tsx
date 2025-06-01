'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, Settings, Sparkles, Zap, User } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
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
      <div className="h-full backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Bot className="h-10 w-10 text-blue-500 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Select an Agent
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm">
            Choose a connection from your sidebar to begin an AI-enhanced conversation
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-white/50 to-blue-50/50 dark:from-gray-900/50 dark:to-blue-900/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse"></div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {selectedUser.username}
              </h2>
              <div className="flex items-center space-x-2">
                <Sparkles className="h-3 w-3 text-purple-500" />
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {AgentToneLabels[selectedConversation?.my_agent_tone || AgentTone.NICER]}
                </p>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowToneSettings(!showToneSettings)}
            className="hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all duration-200"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tone Settings Panel */}
      {showToneSettings && (
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
              AI Agent Personality
            </label>
            <Select value={selectedTone} onValueChange={(value) => setSelectedTone(value as AgentTone)}>
              <SelectTrigger className="bg-white/80 dark:bg-gray-800/80 border-gray-200/50 dark:border-gray-700/50">
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
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                Custom AI Instructions
              </label>
              <Textarea
                value={customPrompt}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCustomPrompt(e.target.value)}
                placeholder="e.g., Transform messages to sound like a wise mentor"
                className="bg-white/80 dark:bg-gray-800/80 border-gray-200/50 dark:border-gray-700/50"
              />
            </div>
          )}
          
          <Button 
            onClick={handleUpdateTone} 
            disabled={updateToneMutation.isPending}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
          >
            {updateToneMutation.isPending ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Updating...</span>
              </div>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Apply Changes
              </>
            )}
          </Button>
        </div>
      )}

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-6" ref={scrollRef}>
        <div className="space-y-6">
          {isLoading && (
            <div className="text-center py-8">
              <div className="inline-flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                <span className="text-sm font-medium">Loading conversation...</span>
              </div>
            </div>
          )}
          
          {messages.map((msg, index) => (
            <div key={msg.id} className={cn(
              "flex",
              msg.is_mine ? "justify-end" : "justify-start"
            )}>
              <div className={cn(
                "max-w-[75%] space-y-2 group",
                msg.is_mine ? "items-end" : "items-start"
              )}>
                <div className={cn(
                  "relative px-4 py-3 rounded-2xl transition-all duration-300 transform hover:scale-[1.02]",
                  msg.is_mine
                    ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg"
                    : "bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 border border-gray-200/50 dark:border-gray-700/50 shadow-md"
                )}>
                  <p className="text-sm leading-relaxed">
                    {msg.transformed_content}
                  </p>
                  
                  {/* AI transformation indicator */}
                  {msg.is_mine && msg.original_content !== msg.transformed_content && (
                    <div className="mt-3 pt-2 border-t border-white/20">
                      <div className="flex items-center space-x-1 text-xs opacity-80">
                        <Sparkles className="h-3 w-3" />
                        <span>AI Enhanced</span>
                      </div>
                      <p className="text-xs opacity-70 mt-1 italic">
                        Original: {msg.original_content}
                      </p>
                    </div>
                  )}
                  
                  {/* Message tail */}
                  <div className={cn(
                    "absolute w-3 h-3 transform rotate-45",
                    msg.is_mine
                      ? "bg-gradient-to-br from-blue-500 to-purple-600 -right-1 bottom-3"
                      : "bg-white/80 dark:bg-gray-800/80 border-l border-b border-gray-200/50 dark:border-gray-700/50 -left-1 bottom-3"
                  )} />
                </div>
                
                <p className={cn(
                  "text-xs px-2 transition-opacity duration-300",
                  msg.is_mine ? "text-gray-500 dark:text-gray-400" : "text-gray-400 dark:text-gray-500"
                )}>
                  {format(new Date(msg.timestamp), 'HH:mm')}
                </p>
              </div>
            </div>
          ))}
          
          {sendMessageMutation.isPending && (
            <div className="flex justify-end">
              <div className="max-w-[75%]">
                <div className="bg-gradient-to-br from-blue-400/50 to-purple-500/50 rounded-2xl px-4 py-3 border-2 border-dashed border-blue-400/30">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce animation-delay-100"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce animation-delay-200"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-300 ml-2">AI processing...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-6 border-t border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-white/50 to-blue-50/50 dark:from-gray-900/50 dark:to-blue-900/10">
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={sendMessageMutation.isPending || !selectedConversation}
              className="bg-white/80 dark:bg-gray-800/80 border-gray-200/50 dark:border-gray-700/50 rounded-xl px-4 py-3 pr-12 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-200"
            />
            {message.trim() && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Sparkles className="h-4 w-4 text-purple-500 animate-pulse" />
              </div>
            )}
          </div>
          
          <Button 
            type="submit" 
            disabled={!message.trim() || sendMessageMutation.isPending || !selectedConversation}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl px-6 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
} 