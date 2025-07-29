import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  senderName: string;
  message: string;
  timestamp: string;
  mentions?: string[];
  isOptimistic?: boolean; // Add flag for optimistic updates
}

interface TypingUser {
  username: string;
  timestamp: number;
}

export const useSupabaseChat = (sessionId?: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const { toast } = useToast();
  const channelRef = useRef<any>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const optimisticTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to send typing status
  const sendTypingStatus = useCallback((username: string, isTyping: boolean) => {
    if (!channelRef.current || !username) return;

    console.log('Sending typing status:', { username, isTyping });
    
    if (isTyping) {
      // Send typing start
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing_start',
        payload: { username, timestamp: Date.now() }
      });
    } else {
      // Send typing stop
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing_stop',
        payload: { username }
      });
    }
  }, []);

  // Memoize the message handler to prevent subscription recreation
  const handleNewMessage = useCallback((payload: any) => {
    console.log('Real-time message received:', payload);
    
    const newMessage: ChatMessage = {
      id: payload.new.message_id,
      senderName: payload.new.sender_name,
      message: payload.new.message,
      timestamp: payload.new.created_at,
      mentions: payload.new.mentions
    };
    
    console.log('Processed new message:', newMessage);
    
    setMessages(prev => {
      console.log('Current messages before update:', prev.map(m => ({ id: m.id, isOptimistic: m.isOptimistic })));
      
      // Check if message already exists (to prevent duplicates from optimistic updates)
      const existingMessage = prev.find(msg => msg.id === newMessage.id);
      console.log('Existing message found:', existingMessage);
      
      if (existingMessage) {
        // Clear the optimistic timeout since we got the real message
        const timeout = optimisticTimeouts.current.get(newMessage.id);
        if (timeout) {
          console.log('Clearing optimistic timeout for:', newMessage.id);
          clearTimeout(timeout);
          optimisticTimeouts.current.delete(newMessage.id);
        }
        
        // Replace optimistic message with real one
        const updatedMessages = prev.map(msg => 
          msg.id === newMessage.id ? { ...newMessage, isOptimistic: false } : msg
        );
        console.log('Updated messages after replacing optimistic:', updatedMessages.map(m => ({ id: m.id, isOptimistic: m.isOptimistic })));
        return updatedMessages;
      }
      
      // Add new message if it doesn't exist
      console.log('Adding new message (not optimistic replacement)');
      return [...prev, newMessage];
    });

    // Reset reconnect attempts on successful message
    reconnectAttempts.current = 0;
  }, []);

  // Handle typing events
  const handleTypingStart = useCallback((payload: any) => {
    const { username, timestamp } = payload;
    console.log('Typing start received:', { username, timestamp });
    
    setTypingUsers(prev => {
      // Remove existing entry for this user and add new one
      const filtered = prev.filter(user => user.username !== username);
      return [...filtered, { username, timestamp }];
    });
  }, []);

  const handleTypingStop = useCallback((payload: any) => {
    const { username } = payload;
    console.log('Typing stop received:', { username });
    
    setTypingUsers(prev => prev.filter(user => user.username !== username));
  }, []);

  // Clean up old typing indicators (in case stop event is missed)
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setTypingUsers(prev => 
        prev.filter(user => now - user.timestamp < 5000) // Remove if older than 5 seconds
      );
    }, 1000);

    return () => clearInterval(cleanupInterval);
  }, []);

  // Heartbeat function to check connection
  const startHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
    }

    heartbeatRef.current = setInterval(() => {
      if (channelRef.current && sessionId) {
        // Check if channel is still connected
        const channelState = channelRef.current.state;
        console.log('Heartbeat check - Channel state:', channelState);
        
        if (channelState !== 'joined') {
          console.log('Channel disconnected, attempting reconnection...');
          setIsConnected(false);
          setupSubscription();
        }
      }
    }, 30000); // Check every 30 seconds
  }, [sessionId]);

  const setupSubscription = useCallback(() => {
    if (!sessionId) return;

    // Clean up existing subscription
    if (channelRef.current) {
      console.log('Cleaning up existing subscription');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Clear any existing retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    console.log(`Setting up chat subscription for session: ${sessionId}`);

    // Set up real-time subscription with better error handling
    const channel = supabase
      .channel(`chat_${sessionId}_${Date.now()}`) // Add timestamp to ensure unique channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${sessionId}`
        },
        handleNewMessage
      )
              .on(
          'broadcast',
          { event: 'typing_start' },
          handleTypingStart
        )
        .on(
          'broadcast',
          { event: 'typing_stop' },
          handleTypingStop
        )
      .subscribe((status) => {
        console.log('Chat subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setError(null);
          reconnectAttempts.current = 0;
          console.log('Chat subscription active');
          
          // Start heartbeat monitoring
          startHeartbeat();
          
          toast({
            title: 'Chat terhubung',
            description: 'Realtime chat sudah aktif',
          });
        } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
          setIsConnected(false);
          console.error('Chat subscription error/closed:', status);
          
          // Stop heartbeat
          if (heartbeatRef.current) {
            clearInterval(heartbeatRef.current);
            heartbeatRef.current = null;
          }
          
          // Retry connection with exponential backoff
          if (reconnectAttempts.current < maxReconnectAttempts) {
            reconnectAttempts.current++;
            const retryDelay = Math.min(1000 * Math.pow(2, reconnectAttempts.current - 1), 30000);
            
            console.log(`Retrying chat connection in ${retryDelay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`);
            
            retryTimeoutRef.current = setTimeout(() => {
              console.log('Retrying chat connection...');
              setupSubscription();
            }, retryDelay);
            
            toast({
              title: 'Koneksi chat terputus',
              description: `Mencoba menyambung kembali... (${reconnectAttempts.current}/${maxReconnectAttempts})`,
              variant: 'destructive',
            });
          } else {
            console.error('Max reconnection attempts reached');
            toast({
              title: 'Koneksi chat gagal',
              description: 'Tidak dapat menyambung ke chat. Silakan refresh halaman.',
              variant: 'destructive',
            });
          }
        } else if (status === 'TIMED_OUT') {
          console.warn('Chat subscription timed out');
          setIsConnected(false);
          // Trigger reconnection
          setupSubscription();
        }
      });

    channelRef.current = channel;
  }, [sessionId, handleNewMessage, toast, startHeartbeat, handleTypingStart, handleTypingStop]);

  // Force refresh subscription
  const refreshConnection = useCallback(() => {
    console.log('Manually refreshing chat connection...');
    reconnectAttempts.current = 0;
    setupSubscription();
  }, [setupSubscription]);

  useEffect(() => {
    if (sessionId) {
      loadMessages(sessionId);
      setupSubscription();
    } else {
      setLoading(false);
    }

    return () => {
      console.log('Cleaning up chat subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      // Clear all optimistic timeouts
      optimisticTimeouts.current.forEach(timeout => clearTimeout(timeout));
      optimisticTimeouts.current.clear();
    };
  }, [sessionId, setupSubscription]);

  const loadMessages = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log(`Loading messages for session: ${id}`);

      const { data, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', id)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      const transformedMessages: ChatMessage[] = data.map(msg => ({
        id: msg.message_id,
        senderName: msg.sender_name,
        message: msg.message,
        timestamp: msg.created_at,
        mentions: msg.mentions
      }));

      console.log(`Loaded ${transformedMessages.length} messages`);
      setMessages(transformedMessages);
    } catch (err: any) {
      console.error('Error loading messages:', err);
      setError(err.message);
      toast({
        title: 'Gagal memuat chat',
        description: 'Terjadi kesalahan saat memuat pesan chat',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (senderName: string, message: string, mentions?: string[]) => {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    const messageId = Math.random().toString(36).substring(2, 15);
    const timestamp = new Date().toISOString();

    console.log('Sending message:', { messageId, senderName, message, sessionId });

    // Optimistic update - add message immediately to UI
    const optimisticMessage: ChatMessage = {
      id: messageId,
      senderName,
      message,
      timestamp,
      mentions,
      isOptimistic: true
    };

    console.log('Adding optimistic message:', optimisticMessage);
    setMessages(prev => {
      const newMessages = [...prev, optimisticMessage];
      console.log('Messages after adding optimistic:', newMessages.map(m => ({ id: m.id, isOptimistic: m.isOptimistic })));
      return newMessages;
    });

    // Set timeout to remove optimistic message if not confirmed within 15 seconds
    const optimisticTimeout = setTimeout(() => {
      console.log('Optimistic message timeout, removing:', messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      optimisticTimeouts.current.delete(messageId);
      
      toast({
        title: 'Pesan tidak terkirim',
        description: 'Pesan tidak berhasil dikirim, silakan coba lagi',
        variant: 'destructive',
      });
    }, 15000);
    
    optimisticTimeouts.current.set(messageId, optimisticTimeout);

    try {
      // First, check if session exists
      const { data: sessionExists, error: sessionCheckError } = await supabase
        .from('sessions')
        .select('session_id')
        .eq('session_id', sessionId)
        .single();

      if (sessionCheckError && sessionCheckError.code === 'PGRST116') {
        throw new Error('Session tidak ditemukan. Silakan refresh halaman.');
      } else if (sessionCheckError) {
        throw sessionCheckError;
      }

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000); // 10 second timeout
      });

      const insertPromise = supabase
        .from('chat_messages')
        .insert({
          message_id: messageId,
          session_id: sessionId,
          sender_name: senderName,
          message: message,
          mentions: mentions
        });

      const { error } = await Promise.race([insertPromise, timeoutPromise]) as any;

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      console.log('Message sent successfully:', messageId);

      // Clear the optimistic timeout since message was sent successfully
      const timeout = optimisticTimeouts.current.get(messageId);
      if (timeout) {
        clearTimeout(timeout);
        optimisticTimeouts.current.delete(messageId);
      }

      // Immediately replace optimistic message with real one after successful insert
      console.log('Immediately replacing optimistic message with real one');
      setMessages(prev => {
        const hasOptimistic = prev.find(msg => msg.id === messageId && msg.isOptimistic);
        if (hasOptimistic) {
          console.log('Replacing optimistic message:', messageId);
          return prev.map(msg => 
            msg.id === messageId ? { 
              ...msg, 
              isOptimistic: false,
              timestamp: new Date().toISOString() // Update with current timestamp
            } : msg
          );
        }
        console.log('No optimistic message found to replace');
        return prev;
      });

      if (mentions && mentions.length > 0) {
        toast({
          title: 'Pesan terkirim',
          description: `Anda mention ${mentions.join(', ')}`,
        });
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message);
      
      // Clear the optimistic timeout and remove optimistic message on error
      const timeout = optimisticTimeouts.current.get(messageId);
      if (timeout) {
        clearTimeout(timeout);
        optimisticTimeouts.current.delete(messageId);
      }
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      
      let errorMessage = 'Terjadi kesalahan saat mengirim pesan';
      if (err.message === 'Request timeout') {
        errorMessage = 'Koneksi timeout, coba lagi';
      } else if (err.message.includes('Session tidak ditemukan')) {
        errorMessage = err.message;
      } else if (err.code === '23503') {
        errorMessage = 'Session tidak valid. Silakan refresh halaman.';
      }
      
      toast({
        title: 'Gagal mengirim pesan',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    }
  };

      return {
      messages,
      loading,
      error,
      isConnected,
      sendMessage,
      sendTypingStatus,
      refreshConnection,
      refetch: () => sessionId && loadMessages(sessionId),
      typingUsers
    };
};