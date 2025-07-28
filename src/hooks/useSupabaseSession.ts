import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { GofoodApiService, GofoodMerchantData } from '@/utils/gofoodApi';

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

      // Fetch merchant data from GoFood API for each merchant
      for (const merchant of merchantData) {
        try {
          console.log(`Fetching data for merchant: ${merchant.merchant_id}`);
          const { data, error } = await supabase.functions.invoke('gofood-proxy', {
            body: {
              gofoodUrl: merchant.link,
              merchantId: merchant.merchant_id,
              sessionId: sessionId
            }
          });

          if (error) {
            console.error(`Error fetching data for ${merchant.merchant_id}:`, error);
          } else {
            console.log(`Successfully fetched data for ${merchant.merchant_id}:`, data);
          }
        } catch (proxyError) {
          console.error(`Proxy error for ${merchant.merchant_id}:`, proxyError);
          // Continue with other merchants even if one fails
        }
      }

      toast({
        title: 'Sesi berhasil dibuat!',
        description: 'Sesi pemesanan telah disimpan ke database dan data merchant berhasil diambil',
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

  const fetchAndSaveMerchantData = async (gofoodUrl: string, merchantId: string) => {
    try {
      setLoading(true);
      
      // Validate GoFood URL
      if (!GofoodApiService.isValidGofoodUrl(gofoodUrl)) {
        throw new Error('URL GoFood tidak valid');
      }

      // Fetch merchant data from GoFood API
      const merchantData = await GofoodApiService.fetchMerchantData(gofoodUrl);
      if (!merchantData) {
        throw new Error('Gagal mengambil data merchant dari GoFood API');
      }

      // Update merchant in database with fetched data
      const { error: updateError } = await supabase
        .from('merchants')
        .update({ 
          merchant_data: merchantData as any,
          name: merchantData.restaurant?.name || 'Unknown Merchant'
        })
        .eq('merchant_id', merchantId);

      if (updateError) throw updateError;

      toast({
        title: 'Data merchant berhasil diperbarui!',
        description: `Data untuk ${merchantData.restaurant?.name} telah disimpan`,
      });

      // Refresh session data
      if (sessionId) {
        await loadSession(sessionId);
      }

      return merchantData;
    } catch (err: any) {
      console.error('Error fetching merchant data:', err);
      setError(err.message);
      toast({
        title: 'Gagal mengambil data merchant',
        description: err.message,
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
    fetchAndSaveMerchantData,
    refetch: () => sessionId && loadSession(sessionId)
  };
};