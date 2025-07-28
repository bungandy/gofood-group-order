import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, MessageCircle, AtSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseChat } from "@/hooks/useSupabaseChat";

interface ChatMessage {
  id: string;
  senderName: string;
  message: string;
  timestamp: string;
  mentions?: string[];
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
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Supabase hook for chat functionality
  const { messages, sendMessage, loading } = useSupabaseChat(sessionId);

  // Get all unique customer names for mentions
  const availableUsers = Array.from(new Set(orders.map(order => order.customerName)));

  useEffect(() => {
    // Auto scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendChatMessage = async () => {
    if (!newMessage.trim() || !currentUserName) {
      if (!currentUserName) {
        toast({
          title: "Isi nama terlebih dahulu",
          description: "Silakan isi nama Anda untuk dapat chat",
          variant: "destructive",
        });
      }
      return;
    }

    // Extract mentions from message
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(newMessage)) !== null) {
      mentions.push(match[1]);
    }

    try {
      await sendMessage(
        currentUserName, 
        newMessage, 
        mentions.length > 0 ? mentions : undefined
      );
      
      setNewMessage("");
      setShowMentions(false);
    } catch (error) {
      // Error handling is done in the hook
      console.error('Failed to send message:', error);
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

    return (
      <div
        key={message.id}
        className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} mb-3`}
      >
        <div
          className={`max-w-[70%] rounded-lg px-3 py-2 ${
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
          <div className="text-xs opacity-70 mt-1">
            {new Date(message.timestamp).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            })}
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
            disabled={!currentUserName}
            className="flex-1"
          />
          <Button
            onClick={sendChatMessage}
            disabled={!newMessage.trim() || !currentUserName || loading}
            size="sm"
          >
            <Send className="w-4 h-4" />
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