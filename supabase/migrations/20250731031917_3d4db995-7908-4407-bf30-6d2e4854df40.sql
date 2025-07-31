-- Enable real-time updates for chat_messages table
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;

-- Add chat_messages table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;