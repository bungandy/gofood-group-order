import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, MessageCircle, AtSign, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseChat } from "@/hooks/useSupabaseChat";

interface ChatMessage {
  id: string;
  senderName: string;
  message: string;
  timestamp: string;
  mentions?: string[];
  isOptimistic?: boolean;
}

interface Order {
  id: string;
  customerName: string;
  items: { menuItem: any; quantity: number }[];
  notes?: string;
  total: number;
  timestamp: string;
}

interface GroupChatProps {
  sessionId: string;
  currentUserName: string;
  orders: Order[];
}

export const GroupChat = ({ sessionId, currentUserName, orders }: GroupChatProps) => {
  const [newMessage, setNewMessage] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Supabase hook for chat functionality
  const { messages, sendMessage, loading, isConnected, refreshConnection } = useSupabaseChat(sessionId);

  // Get all unique customer names for mentions
  const availableUsers = Array.from(new Set(orders.map(order => order.customerName)));

  // Function to scroll to bottom
  const scrollToBottom = () => {
    // Only scroll the container directly, don't use scrollIntoView to avoid page scroll
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current;
      // Try multiple methods to ensure scroll works
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
      
      // Also try to find the viewport element inside ScrollArea
      const viewport = scrollContainer.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  };

  useEffect(() => {
    // Auto scroll to bottom when new messages arrive
    // Immediate scroll without animation to avoid page scroll
    scrollToBottom();
    
    // Additional scroll after a short delay for any rendering delays
    const timeoutId = setTimeout(scrollToBottom, 100);
    
    return () => clearTimeout(timeoutId);
  }, [messages]);

  // Auto scroll when typing indicator appears
  useEffect(() => {
    if (isTyping) {
      const timeoutId = setTimeout(scrollToBottom, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [isTyping]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Separate effect for notification sound and toast to avoid interference with scrolling
  useEffect(() => {
    // Play notification sound and show toast for new messages from other users
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.senderName !== currentUserName && !lastMessage.isOptimistic) {
        // Show toast notification for new message
        toast({
          title: `Pesan baru dari ${lastMessage.senderName}`,
          description: lastMessage.message.length > 50 
            ? lastMessage.message.substring(0, 50) + '...' 
            : lastMessage.message,
          duration: 3000,
        });

        // Simple notification sound using Web Audio API
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.2);
        } catch (error) {
          // Ignore audio errors
          console.log('Audio notification not available');
        }
      }
    }
  }, [messages, currentUserName, toast]);

  const handleRefreshConnection = () => {
    toast({
      title: 'Menyegarkan koneksi',
      description: 'Mencoba menyambung ulang ke chat...',
    });
    refreshConnection();
  };

  const sendChatMessage = async () => {
    if (!newMessage.trim() || !currentUserName || isSending) {
      if (!currentUserName) {
        toast({
          title: "Isi nama terlebih dahulu",
          description: "Silakan isi nama Anda untuk dapat chat",
          variant: "destructive",
        });
      }
      return;
    }

    console.log('Starting to send message:', { newMessage, currentUserName, isSending });

    // Extract mentions from message
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(newMessage)) !== null) {
      mentions.push(match[1]);
    }

    setIsSending(true);
    const messageToSend = newMessage;
    setNewMessage(""); // Clear input immediately for better UX
    setShowMentions(false);
    setIsTyping(false); // Hide typing indicator
    
    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    // Scroll to bottom immediately after adding optimistic message
    setTimeout(scrollToBottom, 50);

    console.log('About to call sendMessage hook');

    try {
      await sendMessage(
        currentUserName, 
        messageToSend, 
        mentions.length > 0 ? mentions : undefined
      );
      console.log('sendMessage completed successfully');
      
      // Scroll to bottom after sending message
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('sendMessage failed:', error);
      // Restore message on error
      setNewMessage(messageToSend);
    } finally {
      console.log('Setting isSending to false');
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      sendChatMessage();
    }
  };

  const insertMention = (userName: string) => {
    const cursorPosition = inputRef.current?.selectionStart || 0;
    const textBefore = newMessage.substring(0, cursorPosition);
    const textAfter = newMessage.substring(cursorPosition);
    
    // Find the last @ symbol before cursor
    const lastAtIndex = textBefore.lastIndexOf("@");
    const beforeAt = textBefore.substring(0, lastAtIndex);
    
    setNewMessage(`${beforeAt}@${userName} ${textAfter}`);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);
    
    // Show typing indicator
    if (value.trim() && !isTyping) {
      setIsTyping(true);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to hide typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
    
    // Show mentions when typing @
    const lastAtIndex = value.lastIndexOf("@");
    if (lastAtIndex !== -1) {
      const textAfterAt = value.substring(lastAtIndex + 1);
      if (!textAfterAt.includes(" ")) {
        setShowMentions(true);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const renderMessage = (message: ChatMessage) => {
    let messageContent = message.message;
    
    // Replace mentions with highlighted text
    if (message.mentions) {
      message.mentions.forEach(mention => {
        const regex = new RegExp(`@${mention}`, "g");
        messageContent = messageContent.replace(
          regex, 
          `<span class="bg-primary/20 text-primary px-1 rounded font-medium">@${mention}</span>`
        );
      });
    }

    const isCurrentUser = message.senderName === currentUserName;
    const isMentioned = message.mentions?.includes(currentUserName);
    const isOptimistic = message.isOptimistic;

    return (
      <div
        key={message.id}
        className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} mb-3 ${
          isOptimistic ? "opacity-70" : ""
        }`}
      >
        <div
          className={`max-w-[70%] rounded-lg px-3 py-2 relative ${
            isCurrentUser
              ? "bg-primary text-primary-foreground"
              : isMentioned
              ? "bg-accent/50 border border-primary/30"
              : "bg-muted"
          }`}
        >
          {!isCurrentUser && (
            <div className="text-xs font-medium mb-1 text-muted-foreground">
              {message.senderName}
            </div>
          )}
          <div
            className="text-sm"
            dangerouslySetInnerHTML={{ __html: messageContent }}
          />
          <div className="text-xs opacity-70 mt-1 flex items-center gap-1">
            {new Date(message.timestamp).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            })}
            {isOptimistic && (
              <span className="text-xs">⏳</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageCircle className="w-4 h-4" />
          Chat Grup
          {messages.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {messages.length}
            </Badge>
          )}
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1">
              {isConnected ? (
                <Wifi className="w-3 h-3 text-green-500" />
              ) : (
                <WifiOff className="w-3 h-3 text-red-500" />
              )}
              <span className="text-xs text-muted-foreground">
                {isConnected ? 'Realtime Aktif' : 'Terputus'}
              </span>
            </div>
            {!isConnected && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefreshConnection}
                className="h-6 px-2 text-xs"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Sambung
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Messages */}
        <ScrollArea className="h-64 w-full pr-4" ref={scrollAreaRef}>
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              Belum ada chat. Mulai percakapan!
            </div>
          ) : (
            <div className="space-y-1">
              {messages.map(renderMessage)}
              {isTyping && currentUserName && (
                <div className="flex justify-start mb-3">
                  <div className="max-w-[70%] rounded-lg px-3 py-2 bg-muted/50 border border-dashed">
                    <div className="text-xs font-medium mb-1 text-muted-foreground">
                      {currentUserName}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <span>sedang mengetik</span>
                      <div className="flex gap-1">
                        <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Mentions dropdown */}
        {showMentions && availableUsers.length > 0 && (
          <div className="border rounded-lg bg-background shadow-lg p-2 space-y-1">
            <div className="text-xs text-muted-foreground px-2 py-1">
              Mention seseorang:
            </div>
            {availableUsers.map((user) => (
              <button
                key={user}
                onClick={() => insertMention(user)}
                className="w-full text-left px-2 py-1 text-sm hover:bg-muted rounded flex items-center gap-2"
              >
                <AtSign className="w-3 h-3" />
                {user}
              </button>
            ))}
          </div>
        )}

        {/* Message input */}
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder={
              currentUserName
                ? "Ketik pesan... (gunakan @ untuk mention)"
                : "Isi nama Anda terlebih dahulu untuk chat"
            }
            value={newMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            disabled={!currentUserName || isSending}
            className="flex-1"
          />
          <Button
            onClick={sendChatMessage}
            disabled={!newMessage.trim() || !currentUserName || loading || isSending}
            size="sm"
          >
            {isSending ? (
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        {availableUsers.length > 0 && (
          <div className="text-xs text-muted-foreground">
            Pemesan aktif: {availableUsers.join(", ")}
          </div>
        )}
      </CardContent>
    </Card>
  );
};