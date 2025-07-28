import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Merchant {
  id: string;
  name: string;
  link: string;
}

interface SessionData {
  sessionId: string;
  sessionName: string;
  merchants: Merchant[];
}

export const useSupabaseSession = (sessionId?: string) => {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  const loadSession = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      // Get session data
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('session_id', id)
        .single();

      if (sessionError) {
        if (sessionError.code === 'PGRST116') {
          // Session not found, create mock data for development
          setSessionData({
            sessionId: id,
            sessionName: 'Grup Order - Demo Session',
            merchants: [
              {
                id: 'merchant_1',
                name: 'Warung Gudeg Bu Sari',
                link: 'https://gofood.co.id/warung-gudeg'
              },
              {
                id: 'merchant_2', 
                name: 'Ayam Geprek Bensu',
                link: 'https://gofood.co.id/ayam-geprek'
              },
              {
                id: 'merchant_3',
                name: 'Bakso Solo Samrat',
                link: 'https://gofood.co.id/bakso-solo'
              }
            ]
          });
        } else {
          throw sessionError;
        }
      } else {
        // Get merchants for this session
        const { data: merchants, error: merchantsError } = await supabase
          .from('merchants')
          .select('*')
          .eq('session_id', id);

        if (merchantsError) throw merchantsError;

        setSessionData({
          sessionId: session.session_id,
          sessionName: session.session_name,
          merchants: merchants.map(m => ({
            id: m.merchant_id,
            name: m.name,
            link: m.link
          }))
        });
      }
    } catch (err: any) {
      console.error('Error loading session:', err);
      setError(err.message);
      toast({
        title: 'Gagal memuat sesi',
        description: 'Terjadi kesalahan saat memuat data sesi',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createSession = async (sessionName: string, merchants: Omit<Merchant, 'id'>[]) => {
    try {
      setLoading(true);
      setError(null);

      const sessionId = Math.random().toString(36).substring(2, 15);

      // Create session
      const { error: sessionError } = await supabase
        .from('sessions')
        .insert({
          session_id: sessionId,
          session_name: sessionName
        });

      if (sessionError) throw sessionError;

      // Create merchants
      const merchantData = merchants.map((merchant, index) => ({
        session_id: sessionId,
        merchant_id: `merchant_${index + 1}`,
        name: merchant.name,
        link: merchant.link
      }));

      const { error: merchantsError } = await supabase
        .from('merchants')
        .insert(merchantData);

      if (merchantsError) throw merchantsError;

      toast({
        title: 'Sesi berhasil dibuat!',
        description: 'Sesi pemesanan telah disimpan ke database',
      });

      return sessionId;
    } catch (err: any) {
      console.error('Error creating session:', err);
      setError(err.message);
      toast({
        title: 'Gagal membuat sesi',
        description: 'Terjadi kesalahan saat menyimpan sesi',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    sessionData,
    loading,
    error,
    createSession,
    refetch: () => sessionId && loadSession(sessionId)
  };
};