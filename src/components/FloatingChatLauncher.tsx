import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const FloatingChatLauncher = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Chat Panel */}
      {isOpen && (
        <Card className="fixed bottom-20 right-6 w-80 h-96 shadow-2xl animate-scale-in z-40">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">ShieldMate Assistant</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleChat}
                className="h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="flex-1 space-y-3 mb-4">
              <div className="chat-bubble">
                <p className="text-sm">
                  Hi! I'm here to help you navigate ShieldMate. How can I assist you today?
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="text-xs">
                  Find missions
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  My progress
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  Get help
                </Button>
              </div>
            </div>
            <div className="border-t pt-3">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 text-sm bg-muted rounded-md border-0 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button size="sm" className="btn-primary">
                  Send
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Floating Button */}
      <button
        onClick={toggleChat}
        className="floating-chat"
        aria-label="Open AI Assistant"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </button>
    </>
  );
};