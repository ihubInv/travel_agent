"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Loader2, MessageSquare, Trash2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// type ChatHistory = {
//   id: string
//   message: string
//   response: string
//   created_at: string
// }

export default function ChatsPage() {
  // const { getChatHistory, deleteChat ,chatHistory} = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  // const [chatHistory, setChatHistory] = useState<ChatHistory[]>([])
  
  // Delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteChatId, setDeleteChatId] = useState<string | null>(null)


  const getChatHistory = async () => {
    debugger
    
    try {
      const response = await fetch(`${API_URL}/api/sessions`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch chat history');
      }
      const data = await response.json();
      const sessions = Array.isArray(data) ? data : [];
      setChatHistory(sessions);
      console.log("data", sessions);
      return sessions;
    } catch (error) {
      console.error('Error fetching chat history:', error);
      setChatHistory([]);
      throw error;
    }
  }


  useEffect(() => {
    getChatHistory()
  
  }, [])

  const fetchChats = async () => {
    try {
      const chatsData = await getChatHistory()
      
      // Convert the data to match our local ChatHistory type
      console.log("chatsData",chatsData)
      const mappedChats = chatsData.map(chat => {
        // Find the first user message and first bot response
        const userMessage = chat.messages.find(m => m.type === 'user')?.content || '';
        const botResponse = chat.messages.find(m => m.type === 'bot')?.content || '';
        
        return {
          id: chat.id,
          message: userMessage,
          response: botResponse,
          created_at: chat.createdAt.toISOString()
        };
      });
      
      setChatHistory(mappedChats);
    } catch (err) {
      setError("Failed to load chat history")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteChat = async () => {
    if (!deleteChatId) return

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await deleteChat(deleteChatId)
      setSuccess("Chat deleted successfully")
      setIsDeleteDialogOpen(false)
      setDeleteChatId(null)
      fetchChats()
    } catch (err) {
      setError("Failed to delete chat")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Chat History</CardTitle>
          <CardDescription>View your past conversations with our AI agent</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="mb-4">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {chatHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No chat history found
                </div>
              ) : (
                chatHistory.map((chat) => (
                  <Card key={chat.id} className="hover:bg-accent/50 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="bg-primary/10 p-3 rounded-full">
                          <MessageSquare className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium mb-2">{chat.message}</div>
                          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                            {chat.response}
                          </div>
                          <div className="text-xs text-muted-foreground mt-2">
                            {new Date(chat.created_at).toLocaleString()}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setDeleteChatId(chat.id)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Chat</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this chat? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setDeleteChatId(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteChat}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Chat"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 