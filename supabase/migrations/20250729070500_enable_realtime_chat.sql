-- Enable realtime for chat_messages table
-- This ensures that realtime subscriptions work properly

-- Drop publication if it exists and recreate it
DROP PUBLICATION IF EXISTS supabase_realtime;

-- Create the realtime publication with all tables
CREATE PUBLICATION supabase_realtime FOR ALL TABLES;

-- Specifically add chat_messages to realtime publication (redundant but explicit)
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;

-- Enable realtime for the specific table
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.orders REPLICA IDENTITY FULL;

-- Grant necessary permissions for realtime
GRANT SELECT ON public.chat_messages TO anon;
GRANT INSERT ON public.chat_messages TO anon;
GRANT UPDATE ON public.chat_messages TO anon;
GRANT DELETE ON public.chat_messages TO anon;

GRANT SELECT ON public.orders TO anon;
GRANT INSERT ON public.orders TO anon;
GRANT UPDATE ON public.orders TO anon;
GRANT DELETE ON public.orders TO anon;

GRANT SELECT ON public.order_items TO anon;
GRANT INSERT ON public.order_items TO anon;
GRANT UPDATE ON public.order_items TO anon;
GRANT DELETE ON public.order_items TO anon;
