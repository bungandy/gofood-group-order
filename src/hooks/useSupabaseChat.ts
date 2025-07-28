import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  senderName: string;
  message: string;
  timestamp: string;
  mentions?: string[];
}

export const useSupabaseChat = (sessionId?: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (sessionId) {
      loadMessages(sessionId);
      
      // Set up real-time subscription
      const channel = supabase
        .channel(`chat_${sessionId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `session_id=eq.${sessionId}`
          },
          (payload) => {
            const newMessage: ChatMessage = {
              id: payload.new.message_id,
              senderName: payload.new.sender_name,
              message: payload.new.message,
              timestamp: payload.new.created_at,
              mentions: payload.new.mentions
            };
            setMessages(prev => [...prev, newMessage]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  const loadMessages = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

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
    if (!sessionId) return;

    try {
      const messageId = Math.random().toString(36).substring(2, 15);

      const { error } = await supabase
        .from('chat_messages')
        .insert({
          message_id: messageId,
          session_id: sessionId,
          sender_name: senderName,
          message: message,
          mentions: mentions
        });

      if (error) throw error;

      if (mentions && mentions.length > 0) {
        toast({
          title: 'Pesan terkirim',
          description: `Anda mention ${mentions.join(', ')}`,
        });
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message);
      toast({
        title: 'Gagal mengirim pesan',
        description: 'Terjadi kesalahan saat mengirim pesan',
        variant: 'destructive',
      });
      throw err;
    }
  };

  return {
    messages,
    loading,
    error,
    sendMessage,
    refetch: () => sessionId && loadMessages(sessionId)
  };
};