import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { GofoodApiService } from '@/utils/gofoodApi';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Loader2 } from 'lucide-react';

interface GofoodUrlFormProps {
  sessionId?: string;
}

export const GofoodUrlForm = ({ sessionId }: GofoodUrlFormProps) => {
  const [gofoodUrl, setGofoodUrl] = useState('');
  const [merchantId, setMerchantId] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugResponse, setDebugResponse] = useState<any>(null);
  const { fetchAndSaveMerchantData } = useSupabaseSession(sessionId);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!gofoodUrl.trim() || !merchantId.trim()) {
      toast({
        title: 'Input tidak lengkap',
        description: 'Harap isi URL GoFood dan Merchant ID',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setDebugResponse(null);
    
    try {
      // Test the API call directly first
      console.log('Testing direct API call...');
      const apiUrl = GofoodApiService.convertToApiUrl(gofoodUrl.trim());
      if (apiUrl) {
        try {
          const requestHeaders = {
            'Authorization': 'Bearer eyJhbGciOiJkaXIiLCJjdHkiOiJKV1QiLCJlbmMiOiJBMTI4R0NNIiwidHlwIjoiSldUIiwiemlwIjoiREVGIn0..OWL0Ul4brzZjMwhc.DRe5zO4xm25iaR9hgbFnjQ9VarjKoKC0kAWoIlf6fVLDzaoqUA7sISuCyYb83DompahxEgmffOf7sQOPbeEc3c2z6ARPwFS3V6OlEvEX8MjFAX5cpzFMJ_iFN-wKWWA5a3__-HIMbtI-Lq71Ohn67ACRntZDajTgcmBSnjGAB9FoL4J6Z6-ry_nz61jq_NM-CP963b_nfb6m_dI_TdF9FBdfAshyWpiVQJcP4_u5SrBbAk9AQRwYKJLRUtWvwNEn5Nx65vNTsnE1Qfd_A3_ubhx1uSNBAc1VK44iYdN2fMY7JdI7xFz7QiZH28wfRxRLccf9igNY2yoO7OOH9oHO4BHiIJ5anFOhyGyleLoZBUI38l6aF6og0OBlgcG2qpXfaodnQ05k-_Q9FL0a4LHlf0TZMOu4wAGclx-kNIMZ6C6pzWTObp2lS2ENXaEpq3rW9ZxusIng3vRiNuKVrXVlxN-tglb8552W7WFFoNRy0y_Mxo8LwJUEWqFnvGm-dsA0S7SnNfut1g29jmkgW2EmKWfKr1i7-nB-vxlgkljeA_z4XQjNd0jrQHRbwd0LQT735FdCxdI8_qPA1VRcKNvx48sKlL9S3L2iBU3cPNjtyqhBOl8DTMMl2jejgcAaaEso-5QjRQePVwnaBugZoc6mQ-pFScc9BNVcVCm0bj7UcxgIuUUxH9rLAEtgR8NrU93Yc1NO7ih0vTB_cqlCjqQFOTrfuiCckhu1OGRLT184oEui950b0dV22t_ou341himF_GbxbyWA1ZYV3h6uzFSyQQFfUDS_EIar1_5596fHIHM9IRpIrjMQWh5_JTloPgdPwFMcSVgobwvNQbuhddYuGO5R8LQS2R76VnuQPiyZ4ZxucFjUPqd9Tzmw3pHOP4qUyQGcHNFVN2tcQhdOSKNWymIsXRg3-X5mzorrt6pQxOR7Xoa1q_Zzxh5uMmk5mkaPMmE.POHpRDKClBxvJ42dE6fmpg',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          };

          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: requestHeaders
          });
          
          setDebugResponse({
            url: apiUrl,
            method: 'GET',
            requestHeaders: requestHeaders,
            status: response.status,
            statusText: response.statusText,
            responseHeaders: Object.fromEntries(response.headers.entries()),
            ok: response.ok
          });

          if (response.ok) {
            const data = await response.json();
            setDebugResponse(prev => ({ ...prev, data }));
          } else {
            const errorText = await response.text();
            setDebugResponse(prev => ({ ...prev, error: errorText }));
          }
        } catch (fetchError: any) {
          setDebugResponse({
            url: apiUrl,
            fetchError: fetchError.message,
            error: 'Network request failed - likely CORS or network issue'
          });
        }
      }
      
      await fetchAndSaveMerchantData(gofoodUrl.trim(), merchantId.trim());
      
      // Reset form
      setGofoodUrl('');
      setMerchantId('');
    } catch (error: any) {
      console.error('Main error:', error);
      setDebugResponse(prev => ({ ...prev, mainError: error.message }));
    } finally {
      setLoading(false);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setGofoodUrl(url);
    
    // Auto-extract merchant ID from URL if possible
    if (url) {
      const extractedId = GofoodApiService.extractRestaurantId(url);
      if (extractedId) {
        setMerchantId(extractedId);
      }
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Import Data Merchant dari GoFood</CardTitle>
        <CardDescription>
          Masukkan URL GoFood untuk mengambil data merchant secara otomatis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gofood-url">URL GoFood</Label>
            <Input
              id="gofood-url"
              type="url"
              value={gofoodUrl}
              onChange={handleUrlChange}
              placeholder="https://gofood.co.id/jakarta/restaurant/rm-sinar-minang-metland-d028264f-8da3-4bcd-a33e-fcc8f2a30882"
              required
            />
            <p className="text-sm text-muted-foreground">
              Contoh: https://gofood.co.id/jakarta/restaurant/nama-restaurant-uuid
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="merchant-id">Merchant ID</Label>
            <Input
              id="merchant-id"
              value={merchantId}
              onChange={(e) => setMerchantId(e.target.value)}
              placeholder="merchant_1 atau ID yang sudah ada"
              required
            />
            <p className="text-sm text-muted-foreground">
              ID merchant yang akan diperbarui datanya
            </p>
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Mengambil Data...
              </>
            ) : (
              'Import Data Merchant'
            )}
          </Button>
        </form>

        {gofoodUrl && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <h4 className="font-medium text-sm mb-2">Preview API URL:</h4>
            <code className="text-xs break-all">
              {GofoodApiService.convertToApiUrl(gofoodUrl) || 'URL tidak valid'}
            </code>
          </div>
        )}

        {debugResponse && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-medium text-sm mb-3 text-red-800">Debug Response:</h4>
            <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-96 whitespace-pre-wrap">
              {JSON.stringify(debugResponse, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};