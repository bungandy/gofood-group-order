import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { gofoodUrl, merchantId, sessionId } = await req.json();
    
    console.log('Received request:', { gofoodUrl, merchantId, sessionId });

    // Extract restaurant ID from GoFood URL - support both restaurant and brand URLs
    const restaurantPattern = /restaurant\/[^\/]+-([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/;
    const brandPattern = /restaurants\/brand\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/;
    
    let match = gofoodUrl.match(restaurantPattern);
    if (!match) {
      match = gofoodUrl.match(brandPattern);
    }
    
    if (!match) {
      throw new Error('Invalid GoFood URL format');
    }
    
    const restaurantId = match[1];
    console.log('Extracted restaurant ID:', restaurantId);

    // Construct API URL
    const apiUrl = `https://api.gojekapi.com/gofood/consumer/v5/restaurants/${restaurantId}?picked_loc=-6.2032022%2C106.715`;
    console.log('API URL:', apiUrl);

    // GoFood API request with bearer token
    const gofoodResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJkaXIiLCJjdHkiOiJKV1QiLCJlbmMiOiJBMTI4R0NNIiwidHlwIjoiSldUIiwiemlwIjoiREVGIn0..OWL0Ul4brzZjMwhc.DRe5zO4xm25iaR9hgbFnjQ9VarjKoKC0kAWoIlf6fVLDzaoqUA7sISuCyYb83DompahxEgmffOf7sQOPbeEc3c2z6ARPwFS3V6OlEvEX8MjFAX5cpzFMJ_iFN-wKWWA5a3__-HIMbtI-Lq71Ohn67ACRntZDajTgcmBSnjGAB9FoL4J6Z6-ry_nz61jq_NM-CP963b_nfb6m_dI_TdF9FBdfAshyWpiVQJcP4_u5SrBbAk9AQRwYKJLRUtWvwNEn5Nx65vNTsnE1Qfd_A3_ubhx1uSNBAc1VK44iYdN2fMY7JdI7xFz7QiZH28wfRxRLccf9igNY2yoO7OOH9oHO4BHiIJ5anFOhyGyleLoZBUI38l6aF6og0OBlgcG2qpXfaodnQ05k-_Q9FL0a4LHlf0TZMOu4wAGclx-kNIMZ6C6pzWTObp2lS2ENXaEpq3rW9ZxusIng3vRiNuKVrXVlxN-tglb8552W7WFFoNRy0y_Mxo8LwJUEWqFnvGm-dsA0S7SnNfut1g29jmkgW2EmKWfKr1i7-nB-vxlgkljeA_z4XQjNd0jrQHRbwd0LQT735FdCxdI8_qPA1VRcKNvx48sKlL9S3L2iBU3cPNjtyqhBOl8DTMMl2jejgcAaaEso-5QjRQePVwnaBugZoc6mQ-pFScc9BNVcVCm0bj7UcxgIuUUxH9rLAEtgR8NrU93Yc1NO7ih0vTB_cqlCjqQFOTrfuiCckhu1OGRLT184oEui950b0dV22t_ou341himF_GbxbyWA1ZYV3h6uzFSyQQFfUDS_EIar1_5596fHIHM9IRpIrjMQWh5_JTloPgdPwFMcSVgobwvNQbuhddYuGO5R8LQS2R76VnuQPiyZ4ZxucFjUPqd9Tzmw3pHOP4qUyQGcHNFVN2tcQhdOSKNWymIsXRg3-X5mzorrt6pQxOR7Xoa1q_Zzxh5uMmk5mkaPMmE.POHpRDKClBxvJ42dE6fmpg',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    console.log('GoFood API response status:', gofoodResponse.status);

    if (!gofoodResponse.ok) {
      const errorText = await gofoodResponse.text();
      console.error('GoFood API error:', errorText);
      throw new Error(`GoFood API request failed: ${gofoodResponse.status} ${errorText}`);
    }

    const gofoodData = await gofoodResponse.json();
    console.log('GoFood API response received, updating database...');

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Update merchant data in database
    const { error: updateError } = await supabase
      .from('merchants')
      .update({
        merchant_data: gofoodData
      })
      .eq('session_id', sessionId)
      .eq('merchant_id', merchantId);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw new Error(`Failed to update merchant data: ${updateError.message}`);
    }

    console.log('Merchant data updated successfully');

    return new Response(JSON.stringify({
      success: true,
      data: gofoodData,
      message: 'Merchant data fetched and saved successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in gofood-proxy function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});