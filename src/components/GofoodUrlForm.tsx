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
    try {
      await fetchAndSaveMerchantData(gofoodUrl.trim(), merchantId.trim());
      
      // Reset form
      setGofoodUrl('');
      setMerchantId('');
    } catch (error) {
      // Error already handled by the hook
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
      </CardContent>
    </Card>
  );
};