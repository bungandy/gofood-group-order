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
  isChatOpen?: boolean;
  hideHeader?: boolean;
}

export const GroupChat = ({ sessionId, currentUserName, orders, isChatOpen = false, hideHeader = false }: GroupChatProps) => {
  const [newMessage, setNewMessage] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [filteredUsers, setFilteredUsers] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Store current user name in localStorage for polling detection
  useEffect(() => {
    if (currentUserName) {
      localStorage.setItem('currentUserName', currentUserName);
    }
  }, [currentUserName]);

  // Supabase hook for chat functionality
  const { messages, sendMessage, sendTypingStatus, loading, isConnected, refreshConnection, typingUsers } = useSupabaseChat(sessionId);

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

  // Auto scroll when typing indicator appears (local or from others)
  useEffect(() => {
    if (isTyping || typingUsers.length > 0) {
      const timeoutId = setTimeout(scrollToBottom, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [isTyping, typingUsers]);

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
    // Only show toast if chat modal is not open
    if (messages.length > 0 && !isChatOpen) {
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
  }, [messages, currentUserName, toast, isChatOpen]);

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
    
    // Send typing stop status to others
    if (currentUserName) {
      sendTypingStatus(currentUserName, false);
    }
    
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
    if (showMentions && filteredUsers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedMentionIndex(prev => 
          prev < filteredUsers.length - 1 ? prev + 1 : 0
        );
        return;
      }
      
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedMentionIndex(prev => 
          prev > 0 ? prev - 1 : filteredUsers.length - 1
        );
        return;
      }
      
      if (e.key === "Enter") {
        e.preventDefault();
        if (filteredUsers[selectedMentionIndex]) {
          insertMention(filteredUsers[selectedMentionIndex]);
        }
        return;
      }
      
      if (e.key === "Escape") {
        e.preventDefault();
        setShowMentions(false);
        setFilteredUsers([]);
        return;
      }
    }
    
    if (e.key === "Enter" && !showMentions) {
      e.preventDefault();
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
    
    // Show typing indicator and send to others
    if (value.trim() && !isTyping && currentUserName) {
      setIsTyping(true);
      sendTypingStatus(currentUserName, true);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to hide typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (currentUserName) {
        sendTypingStatus(currentUserName, false);
      }
    }, 1000);
    
    // Show mentions when typing @
    const lastAtIndex = value.lastIndexOf("@");
    if (lastAtIndex !== -1) {
      const textAfterAt = value.substring(lastAtIndex + 1);
      if (!textAfterAt.includes(" ")) {
        // Filter users based on text after @
        const filtered = availableUsers.filter(user => 
          user.toLowerCase().includes(textAfterAt.toLowerCase())
        );
        setFilteredUsers(filtered);
        setSelectedMentionIndex(0);
        setShowMentions(true);
      } else {
        setShowMentions(false);
        setFilteredUsers([]);
      }
    } else {
      setShowMentions(false);
      setFilteredUsers([]);
    }
  };

  // Generate consistent color for sender
  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500',
      'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 'bg-cyan-500'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const renderMessage = (message: ChatMessage) => {
    const isCurrentUser = message.senderName === currentUserName;
    const isMentioned = message.mentions?.includes(currentUserName);
    const isOptimistic = message.isOptimistic;
    
    let messageContent = message.message;
    
    // Replace mentions with highlighted text with proper contrast
    if (message.mentions) {
      message.mentions.forEach(mention => {
        const regex = new RegExp(`@${mention}`, "g");
        // Use different text color based on whether it's current user's message or not
        const mentionStyle = isCurrentUser 
          ? 'color: #ffffff; font-weight: bold; text-shadow: 0 1px 2px rgba(0,0,0,0.3);'
          : 'color: hsl(var(--primary)); font-weight: bold;';
        
        messageContent = messageContent.replace(
          regex, 
          `<span style="${mentionStyle}">@${mention}</span>`
        );
      });
    }

    return (
      <div
        key={message.id}
        className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} mb-2 ${
          isOptimistic ? "opacity-70" : ""
        }`}
      >
        <div className={`flex ${isCurrentUser ? "flex-row-reverse" : "flex-row"} items-end gap-1 max-w-[85%]`}>
          {/* Avatar for other users */}
          {!isCurrentUser && (
            <div className={`w-6 h-6 rounded-full ${getAvatarColor(message.senderName)} flex items-center justify-center text-xs font-medium text-white mb-1`}>
              {message.senderName.charAt(0).toUpperCase()}
            </div>
          )}
          
          {/* Message bubble with tail */}
          <div
            className={`relative px-3 py-2 max-w-[280px] break-words ${
              isCurrentUser
                ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md"
                : isMentioned
                ? "bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-700 text-green-900 dark:text-green-100 rounded-2xl rounded-bl-md"
                : "bg-muted text-foreground rounded-2xl rounded-bl-md"
            }`}
          >
            
            {/* Sender name for other users */}
            {!isCurrentUser && (
              <div className="text-xs font-semibold mb-1 opacity-80">
                {message.senderName}
              </div>
            )}
            
            {/* Message content */}
            <div
              className={`text-sm leading-relaxed ${isCurrentUser ? "text-primary-foreground" : ""}`}
              dangerouslySetInnerHTML={{ __html: messageContent }}
            />
            
            {/* Timestamp */}
            <div className={`text-xs mt-1 flex items-center gap-1 justify-end ${
              isCurrentUser 
                ? "text-primary-foreground/70" 
                : "text-muted-foreground"
            }`}>
              <span>
                {new Date(message.timestamp).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              {isCurrentUser && (
                <span className="text-xs">
                  {isOptimistic ? "⏳" : "✓"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Conditional Header */}
      {!hideHeader && (
        <div className="flex items-center justify-between p-3 border-b border-border bg-background/50 min-h-[60px]">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <MessageCircle className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium text-sm flex-shrink-0">Chat</span>
            {messages.length > 0 && (
              <Badge variant="secondary" className="text-xs h-5 px-2 flex-shrink-0">
                {messages.length}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              {isConnected ? (
                <Wifi className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-red-500" />
              )}
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {isConnected ? 'Online' : 'Offline'}
              </span>
            </div>
            {!isConnected && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefreshConnection}
                className="h-7 w-7 p-0 flex-shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      )}
      {/* Messages Area */}
      <div className="flex-1 min-h-0 px-4 pt-4">
        <ScrollArea className="h-full w-full pr-2" ref={scrollAreaRef}>
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              Belum ada chat. Mulai percakapan!
            </div>
          ) : (
            <div className="space-y-1 pb-4">
              {messages.map(renderMessage)}
              
              {/* Show typing indicators for other users */}
              {typingUsers.filter(user => user.username !== currentUserName).map(user => (
                <div key={user.username} className="flex justify-start mb-3">
                  <div className="max-w-[70%] rounded-lg px-3 py-2 bg-muted/50 border border-dashed">
                    <div className="text-xs font-medium mb-1 text-muted-foreground">
                      {user.username}
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
              ))}
              
              {/* Show typing indicator for current user (local only) */}
              {isTyping && currentUserName && (
                <div className="flex justify-end mb-3">
                  <div className="max-w-[70%] rounded-lg px-3 py-2 bg-primary/20 border border-dashed border-primary/30">
                    <div className="text-xs font-medium mb-1 text-muted-foreground">
                      Anda
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

        {/* Mentions dropdown - positioned absolutely */}
        {showMentions && filteredUsers.length > 0 && (
          <div className="absolute bottom-20 left-4 right-4 border rounded-lg bg-background shadow-lg p-2 space-y-1 z-50">
            <div className="text-xs text-muted-foreground px-2 py-1">
              Mention seseorang: (gunakan ↑↓ untuk navigasi, Enter untuk pilih)
            </div>
            {filteredUsers.map((user, index) => (
              <button
                key={user}
                onClick={() => insertMention(user)}
                className={`w-full text-left px-2 py-1 text-sm rounded flex items-center gap-2 transition-colors ${
                  index === selectedMentionIndex 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-muted"
                }`}
              >
                <AtSign className="w-3 h-3" />
                {user}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fixed Input Area at Bottom */}
      <div className="border-t border-border bg-background p-4 space-y-3">
        {/* Message input */}
        <div className="flex gap-2 items-center">
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
            className="flex-1 h-10"
          />
          <Button
            onClick={sendChatMessage}
            disabled={!newMessage.trim() || !currentUserName || loading || isSending}
            className="h-10 w-10 p-0"
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
      </div>
    </div>
  );
};