import type { GofoodMerchantData } from '@/types';
import { API_CONFIG } from '@/constants';
import { extractRestaurantId, isValidGofoodUrl } from '@/utils';
import axios from 'axios';
import { supabase } from '@/integrations/supabase/client';

export class GofoodApiService {

  /**
   * Convert GoFood URL to API URL
   * @param gofoodUrl Original GoFood URL
   * @returns API URL or null if conversion failed
   */
  static convertToApiUrl(gofoodUrl: string): string | null {
    const restaurantId = extractRestaurantId(gofoodUrl);
    if (!restaurantId) {
      return null;
    }

    return `${API_CONFIG.GOFOOD_BASE_URL}/${restaurantId}?picked_loc=${encodeURIComponent(API_CONFIG.DEFAULT_LOCATION)}`;
  }

  /**
   * Fetch merchant data from GoFood API
   * @param gofoodUrl Original GoFood URL
   * @returns Merchant data or null if failed
   */
  static async fetchMerchantData(gofoodUrl: string): Promise<GofoodMerchantData | null> {
    try {
      const apiUrl = this.convertToApiUrl(gofoodUrl);
      if (!apiUrl) {
        throw new Error('Failed to convert GoFood URL to API URL');
      }

      console.log('Fetching merchant data from:', apiUrl);

      const response = await axios.get(apiUrl, {
        headers: {
          'Authorization': `Bearer ${API_CONFIG.AUTH_TOKEN}`,
          'Content-Type': 'application/json',

          // Device & App Info
          'PhoneMake': 'Apple',
          'X-DeviceOS': 'iOS, 18.5',
          'X-PhoneModel': 'Apple, iPhone 15 Pro Max',
          'X-AppId': 'com.go-jek.ios',
          'X-AppVersion': '5.24.1',
          'X-Platform': 'iOS',
          'User-Agent': 'Gojek/5.24.1 (com.go-jek.ios; build:149285589; iOS 18.5.0) NetworkSDK/2.4.1',

          // Location & Regional
          'X-Location': API_CONFIG.DEFAULT_LOCATION,
          'X-Origin-Location': '',
          'X-Location-Accuracy': '8.508432448047834',
          'Gojek-Country-Code': 'ID',
          'Gojek-Timezone': 'Asia/Jakarta',
          'Gojek-Service-Area': '1',
          'X-User-Locale': 'id_ID',

          // Session & User
          'customer_id': '99',
          'X-User-Type': 'customer',

          // Standard HTTP Headers
          'Accept': '*/*',
          'Accept-Encoding': 'br;q=1.0, gzip;q=0.9, deflate;q=0.8',
          'Accept-Language': 'id-ID',
          'Connection': 'keep-alive'
        }
      });

      return response.data as GofoodMerchantData;
    } catch (error) {
      console.error('Error fetching merchant data:', error);
      
      // Handle axios errors specifically
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
      }
      
      return null;
    }
  }

  /**
   * Fetch merchant data and save to Supabase database
   * @param gofoodUrl Original GoFood URL
   * @param merchantId Merchant ID in the database
   * @param sessionId Session ID
   * @returns Success status and data
   */
  static async fetchAndSaveMerchantData(
    gofoodUrl: string, 
    merchantId: string, 
    sessionId: string
  ): Promise<{ success: boolean; data?: GofoodMerchantData; error?: string }> {
    try {
      console.log(`Fetching data for merchant: ${merchantId}`);
      
      // Fetch merchant data from GoFood API
      const merchantData = await this.fetchMerchantData(gofoodUrl);
      
      if (!merchantData) {
        throw new Error('Failed to fetch merchant data from GoFood API');
      }

      // Save to Supabase database
      const { error: updateError } = await supabase
        .from('merchants')
        .update({
          merchant_data: merchantData
        })
        .eq('session_id', sessionId)
        .eq('merchant_id', merchantId);

      if (updateError) {
        console.error('Database update error:', updateError);
        throw new Error(`Failed to update merchant data: ${updateError.message}`);
      }

      console.log(`Successfully fetched and saved data for ${merchantId}`);
      
      return {
        success: true,
        data: merchantData
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`Error fetching and saving data for ${merchantId}:`, errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Validate if a URL is a valid GoFood restaurant URL
   * @param url URL to validate
   * @returns True if valid GoFood URL
   */
  static isValidGofoodUrl = isValidGofoodUrl;
}