import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  senderName: string;
  message: string;
  timestamp: string;
  mentions?: string[];
  isOptimistic?: boolean;
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
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageCountRef = useRef(0);

  const loadMessages = useCallback(async (id: string, isPolling = false) => {
    try {
      if (!isPolling) {
        setLoading(true);
        setError(null);
      }

      if (!isPolling) console.log(`📥 Loading messages for session: ${id}`);

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

      // If polling and we have new messages, show them
      if (isPolling && transformedMessages.length > lastMessageCountRef.current) {
        console.log(`🔄 Polling detected ${transformedMessages.length - lastMessageCountRef.current} new messages`);
        
        // Show toast for new messages
        const newMessages = transformedMessages.slice(lastMessageCountRef.current);
        newMessages.forEach(msg => {
          if (msg.senderName !== getCurrentUserName()) {
            toast({
              title: `💬 Pesan baru dari ${msg.senderName}`,
              description: msg.message.length > 50 ? msg.message.substring(0, 50) + '...' : msg.message,
              duration: 3000,
            });
          }
        });
      }

      lastMessageCountRef.current = transformedMessages.length;
      setMessages(transformedMessages);

      if (!isPolling) console.log(`📥 Loaded ${transformedMessages.length} messages`);
    } catch (err: any) {
      console.error('Error loading messages:', err);
      if (!isPolling) {
        setError(err.message);
        toast({
          title: 'Gagal memuat chat',
          description: 'Terjadi kesalahan saat memuat pesan chat',
          variant: 'destructive',
        });
      }
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, [toast]);

  // Get current user name (you'll need to pass this from component)
  const getCurrentUserName = useCallback(() => {
    // This is a placeholder - you'll need to get this from your app state
    return localStorage.getItem('currentUserName') || '';
  }, []);

  // Start polling as fallback
  const startPolling = useCallback(() => {
    if (!sessionId) return;

    console.log('🔄 Starting polling fallback (every 3 seconds)');
    
    pollingIntervalRef.current = setInterval(() => {
      loadMessages(sessionId, true);
    }, 3000); // Poll every 3 seconds
  }, [sessionId, loadMessages]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      console.log('⏹️ Stopping polling');
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // Function to send typing status
  const sendTypingStatus = useCallback((username: string, isTyping: boolean) => {
    if (!channelRef.current || !username) return;

    console.log('📝 Sending typing status:', { username, isTyping });
    
    channelRef.current.send({
      type: 'broadcast',
      event: isTyping ? 'typing_start' : 'typing_stop',
      payload: { username, timestamp: Date.now() }
    });
  }, []);

  // Memoize the message handler
  const handleNewMessage = useCallback((payload: any) => {
    console.log('🔥 REALTIME MESSAGE RECEIVED:', payload);
    
    const newMessage: ChatMessage = {
      id: payload.new.message_id,
      senderName: payload.new.sender_name,
      message: payload.new.message,
      timestamp: payload.new.created_at,
      mentions: payload.new.mentions
    };
    
    console.log('✅ Processed new message:', newMessage);
    
    setMessages(prev => {
      // Check if message already exists
      const existingMessage = prev.find(msg => msg.id === newMessage.id);
      
      if (existingMessage) {
        // Clear optimistic timeout
        const timeout = optimisticTimeouts.current.get(newMessage.id);
        if (timeout) {
          clearTimeout(timeout);
          optimisticTimeouts.current.delete(newMessage.id);
        }
        
        // Replace optimistic message with real one
        return prev.map(msg => 
          msg.id === newMessage.id ? { ...newMessage, isOptimistic: false } : msg
        );
      }
      
      // Add new message
      console.log('➕ Adding new message to state');
      lastMessageCountRef.current = prev.length + 1;
      return [...prev, newMessage];
    });

    // Reset reconnect attempts on successful message
    reconnectAttempts.current = 0;
  }, []);

  // Handle typing events
  const handleTypingStart = useCallback((payload: any) => {
    const { username, timestamp } = payload;
    console.log('⌨️ Typing start received:', { username, timestamp });
    
    setTypingUsers(prev => {
      const filtered = prev.filter(user => user.username !== username);
      return [...filtered, { username, timestamp }];
    });
  }, []);

  const handleTypingStop = useCallback((payload: any) => {
    const { username } = payload;
    console.log('⌨️ Typing stop received:', { username });
    
    setTypingUsers(prev => prev.filter(user => user.username !== username));
  }, []);

  // Clean up old typing indicators
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setTypingUsers(prev => 
        prev.filter(user => now - user.timestamp < 5000)
      );
    }, 1000);

    return () => clearInterval(cleanupInterval);
  }, []);

  const setupSubscription = useCallback(() => {
    if (!sessionId) {
      console.log('❌ No sessionId, skipping subscription setup');
      return;
    }

    // Clean up existing subscription
    if (channelRef.current) {
      console.log('🧹 Cleaning up existing subscription');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    console.log(`🚀 Setting up realtime subscription for session: ${sessionId}`);

    // Test connection first
    console.log('🔍 Testing Supabase connection...');
    supabase
      .from('chat_messages')
      .select('count')
      .eq('session_id', sessionId)
      .then(({ data, error }) => {
        if (error) {
          console.error('❌ Supabase connection test failed:', error);
        } else {
          console.log('✅ Supabase connection test passed');
        }
      });

    const channel = supabase
      .channel(`chat_${sessionId}`, {
        config: {
          broadcast: { self: false },
          presence: { key: sessionId },
          private: false
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log('🔥 REALTIME INSERT EVENT RECEIVED!');
          console.log('📦 Payload:', JSON.stringify(payload, null, 2));
          handleNewMessage(payload);
        }
      )
      .on('broadcast', { event: 'typing_start' }, handleTypingStart)
      .on('broadcast', { event: 'typing_stop' }, handleTypingStop)
      .subscribe((status) => {
        console.log(`📡 Subscription status: ${status}`);
        
        switch (status) {
          case 'SUBSCRIBED':
            setIsConnected(true);
            setError(null);
            reconnectAttempts.current = 0;
            stopPolling(); // Stop polling when realtime works
            console.log('✅ REALTIME CONNECTED - Polling stopped');
            console.log('🎯 Listening for INSERT events on chat_messages where session_id =', sessionId);
            
            toast({
              title: '✅ Chat Realtime Aktif',
              description: 'Pesan akan muncul secara realtime',
              duration: 2000,
            });
            break;
            
          case 'CHANNEL_ERROR':
            setIsConnected(false);
            console.error('❌ Realtime failed, starting polling fallback');
            startPolling(); // Start polling as fallback
            
            if (reconnectAttempts.current < maxReconnectAttempts) {
              reconnectAttempts.current++;
              const retryDelay = 2000 * reconnectAttempts.current;
              
              console.log(`🔄 Retrying realtime in ${retryDelay}ms`);
              retryTimeoutRef.current = setTimeout(setupSubscription, retryDelay);
            } else {
              toast({
                title: '⚠️ Menggunakan Mode Polling',
                description: 'Pesan akan diperbarui setiap 3 detik',
                variant: 'default',
              });
            }
            break;
            
          case 'CLOSED':
            setIsConnected(false);
            console.warn('⚠️ Realtime connection closed, starting polling');
            startPolling();
            break;
            
          case 'TIMED_OUT':
            setIsConnected(false);
            console.warn('⏰ Realtime timeout, starting polling');
            startPolling();
            setTimeout(setupSubscription, 5000);
            break;
            
          default:
            console.log(`🔄 Subscription status: ${status}`);
        }
      });

    channelRef.current = channel;
    console.log('📡 Channel created and stored');
  }, [sessionId, handleNewMessage, handleTypingStart, handleTypingStop, toast, startPolling, stopPolling]);

  // Force refresh subscription
  const refreshConnection = useCallback(() => {
    console.log('🔄 Manually refreshing connection...');
    reconnectAttempts.current = 0;
    stopPolling();
    setupSubscription();
  }, [setupSubscription, stopPolling]);

  useEffect(() => {
    if (sessionId) {
      console.log('🚀 Initializing chat for session:', sessionId);
      loadMessages(sessionId);
      setupSubscription();
    } else {
      setLoading(false);
    }

    return () => {
      console.log('🧹 Cleaning up chat');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      stopPolling();
      optimisticTimeouts.current.forEach(timeout => clearTimeout(timeout));
      optimisticTimeouts.current.clear();
    };
  }, [sessionId, loadMessages, setupSubscription, stopPolling]);

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