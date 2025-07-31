import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GroupChat } from '@/components/GroupChat';
import { Order } from '@/types';

interface FloatingChatProps {
  sessionId: string;
  currentUserName: string;
  orders: Order[];
}

export const FloatingChat: React.FC<FloatingChatProps> = ({
  sessionId,
  currentUserName,
  orders
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);

  // Load saved state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('floating-chat-state');
    if (savedState) {
      const { isOpen: savedIsOpen } = JSON.parse(savedState);
      setIsOpen(savedIsOpen);
    }
  }, []);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem('floating-chat-state', JSON.stringify({ isOpen }));
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
      // Ctrl/Cmd + K to toggle chat
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHasNewMessages(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <div className={`fixed bottom-4 right-4 ${isOpen ? 'z-30' : 'z-50'}`}>
        <Button
          onClick={toggleChat}
          size="lg"
          className="relative h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-primary hover:bg-primary/90"
          aria-label={isOpen ? 'Close chat' : 'Open chat'}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <>
              <MessageCircle className="h-6 w-6" />
              {hasNewMessages && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
                  !
                </Badge>
              )}
            </>
          )}
        </Button>
      </div>

      {/* Floating Chat Window */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:inset-auto lg:bottom-20 lg:right-4 lg:w-[400px] lg:h-[600px]">
          {/* Mobile overlay backdrop */}
          <div 
            className="lg:hidden absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Chat container */}
          <div className="relative flex flex-col h-full bg-background lg:rounded-xl lg:shadow-2xl lg:border border-border animate-in slide-in-from-bottom-4 lg:slide-in-from-right-4 duration-300 lg:overflow-hidden">
            {/* Mobile header */}
            <div className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-foreground">Group Chat</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0 hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Desktop header */}
            <div className="hidden lg:flex items-center justify-between px-4 py-3 border-b border-border bg-background">
              <h3 className="text-sm font-semibold text-foreground">Group Chat</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 p-0 hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            {/* Chat content */}
            <div className="flex-1 min-h-0">
              <GroupChat
                sessionId={sessionId}
                currentUserName={currentUserName}
                orders={orders}
                isChatOpen={isOpen}
              />
            </div>
          </div>
        </div>
      )}

      {/* Keyboard shortcut hint */}
      {!isOpen && (
        <div className="fixed bottom-20 right-4 z-30 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded border opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
          Press Ctrl+K to open chat
        </div>
      )}
    </>
  );
};