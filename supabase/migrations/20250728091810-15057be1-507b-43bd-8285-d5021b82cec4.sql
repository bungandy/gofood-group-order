-- Drop triggers first, then function, then recreate with proper security
DROP TRIGGER IF EXISTS update_sessions_updated_at ON public.sessions;
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- Create function with proper security
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate triggers
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();