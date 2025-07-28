-- Add merchant_data column to store API response data
ALTER TABLE public.merchants 
ADD COLUMN merchant_data JSONB;