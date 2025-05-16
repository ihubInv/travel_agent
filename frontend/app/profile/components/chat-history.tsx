"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/components/auth-provider";
import { MessageSquare, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface Chat {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  flightDetails?: {
    from: string;
    to: string;
    date: string;
  };
}

export function ChatHistory() {
  const { toast } = useToast();
  const { getChats, deleteChat } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      setIsLoading(true);
      const response = await getChats();
      if (response.success) {
        setChats(response.data);
      } else {
        toast({
          title: "Error",
          description: "Failed to load chat history",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while loading chat history",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      const response = await deleteChat(chatId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Chat deleted successfully"
        });
        loadChats();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete chat",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while deleting chat",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Chat History</CardTitle>
        </CardHeader>
        <CardContent>
          {chats.length === 0 ? (
            <p className="text-muted-foreground">No chat history found.</p>
          ) : (
            <div className="space-y-4">
              {chats.map((chat) => (
                <Card key={chat.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <MessageSquare className="h-8 w-8" />
                        <div>
                          <p className="font-medium">{chat.title}</p>
                          <p className="text-sm text-muted-foreground">{chat.lastMessage}</p>
                          {chat.flightDetails && (
                            <p className="text-sm text-muted-foreground">
                              Flight: {chat.flightDetails.from} → {chat.flightDetails.to} on{" "}
                              {format(new Date(chat.flightDetails.date), "MMM d, yyyy")}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(chat.timestamp), "MMM d, yyyy h:mm a")}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteChat(chat.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 