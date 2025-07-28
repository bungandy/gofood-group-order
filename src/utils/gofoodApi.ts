export interface GofoodMerchantData {
  restaurant: {
    id: string;
    name: string;
    image_url?: string;
    description?: string;
    rating?: number;
    delivery_fee?: number;
    min_order?: number;
    categories?: string[];
    menu?: any[];
  };
}

export class GofoodApiService {
  private static readonly API_BASE_URL = 'https://api.gojekapi.com/gofood/consumer/v5/restaurants';
  private static readonly AUTH_TOKEN = 'eyJhbGciOiJkaXIiLCJjdHkiOiJKV1QiLCJlbmMiOiJBMTI4R0NNIiwidHlwIjoiSldUIiwiemlwIjoiREVGIn0..OWL0Ul4brzZjMwhc.DRe5zO4xm25iaR9hgbFnjQ9VarjKoKC0kAWoIlf6fVLDzaoqUA7sISuCyYb83DompahxEgmffOf7sQOPbeEc3c2z6ARPwFS3V6OlEvEX8MjFAX5cpzFMJ_iFN-wKWWA5a3__-HIMbtI-Lq71Ohn67ACRntZDajTgcmBSnjGAB9FoL4J6Z6-ry_nz61jq_NM-CP963b_nfb6m_dI_TdF9FBdfAshyWpiVQJcP4_u5SrBbAk9AQRwYKJLRUtWvwNEn5Nx65vNTsnE1Qfd_A3_ubhx1uSNBAc1VK44iYdN2fMY7JdI7xFz7QiZH28wfRxRLccf9igNY2yoO7OOH9oHO4BHiIJ5anFOhyGyleLoZBUI38l6aF6og0OBlgcG2qpXfaodnQ05k-_Q9FL0a4LHlf0TZMOu4wAGclx-kNIMZ6C6pzWTObp2lS2ENXaEpq3rW9ZxusIng3vRiNuKVrXVlxN-tglb8552W7WFFoNRy0y_Mxo8LwJUEWqFnvGm-dsA0S7SnNfut1g29jmkgW2EmKWfKr1i7-nB-vxlgkljeA_z4XQjNd0jrQHRbwd0LQT735FdCxdI8_qPA1VRcKNvx48sKlL9S3L2iBU3cPNjtyqhBOl8DTMMl2jejgcAaaEso-5QjRQePVwnaBugZoc6mQ-pFScc9BNVcVCm0bj7UcxgIuUUxH9rLAEtgR8NrU93Yc1NO7ih0vTB_cqlCjqQFOTrfuiCckhu1OGRLT184oEui950b0dV22t_ou341himF_GbxbyWA1ZYV3h6uzFSyQQFfUDS_EIar1_5596fHIHM9IRpIrjMQWh5_JTloPgdPwFMcSVgobwvNQbuhddYuGO5R8LQS2R76VnuQPiyZ4ZxucFjUPqd9Tzmw3pHOP4qUyQGcHNFVN2tcQhdOSKNWymIsXRg3-X5mzorrt6pQxOR7Xoa1q_Zzxh5uMmk5mkaPMmE.POHpRDKClBxvJ42dE6fmpg';
  private static readonly DEFAULT_LOCATION = '-6.2032022,106.715'; // Jakarta coordinates

  /**
   * Extract restaurant ID from GoFood URL
   * @param url GoFood restaurant URL
   * @returns Restaurant ID or null if not found
   */
  static extractRestaurantId(url: string): string | null {
    try {
      // Pattern: https://gofood.co.id/jakarta/restaurant/restaurant-name-uuid
      const urlPattern = /\/restaurant\/[^\/]*-([a-f0-9-]{36})$/i;
      const match = url.match(urlPattern);
      return match ? match[1] : null;
    } catch (error) {
      console.error('Error extracting restaurant ID:', error);
      return null;
    }
  }

  /**
   * Convert GoFood URL to API URL
   * @param gofoodUrl Original GoFood URL
   * @returns API URL or null if conversion failed
   */
  static convertToApiUrl(gofoodUrl: string): string | null {
    const restaurantId = this.extractRestaurantId(gofoodUrl);
    if (!restaurantId) {
      return null;
    }

    return `${this.API_BASE_URL}/${restaurantId}?picked_loc=${encodeURIComponent(this.DEFAULT_LOCATION)}`;
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

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.AUTH_TOKEN}`,
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
          'X-Location': this.DEFAULT_LOCATION,
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

      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }

      const data = await response.json();
      return data as GofoodMerchantData;
    } catch (error) {
      console.error('Error fetching merchant data:', error);
      return null;
    }
  }

  /**
   * Validate if a URL is a valid GoFood restaurant URL
   * @param url URL to validate
   * @returns True if valid GoFood URL
   */
  static isValidGofoodUrl(url: string): boolean {
    try {
      const gofoodPattern = /^https:\/\/gofood\.co\.id\/[^\/]+\/restaurant\/[^\/]+-[a-f0-9-]{36}$/i;
      return gofoodPattern.test(url);
    } catch {
      return false;
    }
  }
}