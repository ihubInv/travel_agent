// "use client"

// import { useState, useEffect, useRef } from "react"
// import { useAuth } from "@/components/auth-provider"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { ScrollArea } from "@/components/ui/scroll-area"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
// import { Label } from "@/components/ui/label"
// import { Loader2, Send, CreditCard, Plus } from "lucide-react"
// import { Alert, AlertDescription } from "@/components/ui/alert"

// type Message = {
//   id: string
//   content: string
//   role: "user" | "assistant"
//   timestamp: string
// }

// type CardDetail = {
//   id: string
//   cardNumber: string
//   expiryDate: string
//   cardType: string
// }

// export function Chat() {
//   const { user, isAuthenticated } = useAuth()
//   const [messages, setMessages] = useState<Message[]>([])
//   const [input, setInput] = useState("")
//   const [isLoading, setIsLoading] = useState(false)
//   const [error, setError] = useState<string | null>(null)
//   const [cards, setCards] = useState<CardDetail[]>([])
//   const [isAddingCard, setIsAddingCard] = useState(false)
//   const [newCard, setNewCard] = useState({
//     cardNumber: "",
//     expiryDate: "",
//     cardType: ""
//   })
//   const scrollRef = useRef<HTMLDivElement>(null)

//   useEffect(() => {
//     if (isAuthenticated && user) {
//       fetchChatHistory()
//       fetchCards()
//     }
//   }, [isAuthenticated, user])

//   useEffect(() => {
//     if (scrollRef.current) {
//       scrollRef.current.scrollTop = scrollRef.current.scrollHeight
//     }
//   }, [messages])

//   const fetchChatHistory = async () => {
//     try {
//       const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat-history/${user?.id}`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token")}`,
//         },
//       })
//       if (response.ok) {
//         const data = await response.json()
//         const formattedMessages = data.map((chat: any) => ({
//           id: chat.id,
//           content: chat.message,
//           role: "user" as const,
//           timestamp: chat.created_at,
//         })).concat(data.map((chat: any) => ({
//           id: `${chat.id}-response`,
//           content: chat.response,
//           role: "assistant" as const,
//           timestamp: chat.created_at,
//         })))
//         setMessages(formattedMessages)
//       }
//     } catch (error) {
//       console.error("Error fetching chat history:", error)
//     }
//   }

//   const fetchCards = async () => {
//     try {
//       const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cards`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token")}`,
//         },
//       })
//       if (response.ok) {
//         const data = await response.json()
//         setCards(data)
//       }
//     } catch (error) {
//       console.error("Error fetching cards:", error)
//     }
//   }

//   const handleAddCard = async (e: React.FormEvent) => {
//     e.preventDefault()
//     setIsLoading(true)
//     setError(null)

//     try {
//       const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cards`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${localStorage.getItem("token")}`,
//         },
//         body: JSON.stringify(newCard),
//       })

//       if (!response.ok) {
//         const error = await response.json()
//         throw new Error(error.error || "Failed to add card")
//       }

//       const card = await response.json()
//       setCards(prev => [...prev, card])
//       setIsAddingCard(false)
//       setNewCard({ cardNumber: "", expiryDate: "", cardType: "" })
//     } catch (error) {
//       setError(error instanceof Error ? error.message : "Failed to add card")
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   const handleDeleteCard = async (cardId: string) => {
//     try {
//       const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cards/${cardId}`, {
//         method: "DELETE",
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token")}`,
//         },
//       })

//       if (!response.ok) {
//         const error = await response.json()
//         throw new Error(error.error || "Failed to delete card")
//       }

//       setCards(prev => prev.filter(card => card.id !== cardId))
//     } catch (error) {
//       setError(error instanceof Error ? error.message : "Failed to delete card")
//     }
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     if (!input.trim() || !user) return

//     const userMessage = {
//       id: Date.now().toString(),
//       content: input,
//       role: "user" as const,
//       timestamp: new Date().toISOString(),
//     }

//     setMessages(prev => [...prev, userMessage])
//     setInput("")
//     setIsLoading(true)
//     setError(null)

//     try {
//       // Save user message to MongoDB
//       const saveResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${localStorage.getItem("token")}`,
//         },
//         body: JSON.stringify({
//           message: input,
//           response: "", // Will be updated after AI response
//         }),
//       })

//       if (!saveResponse.ok) {
//         throw new Error("Failed to save message")
//       }

//       // Get AI response (replace with your AI integration)
//       const aiResponse = "This is a sample AI response. Replace with actual AI integration."

//       // Save AI response to MongoDB
//       const saveAiResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${localStorage.getItem("token")}`,
//         },
//         body: JSON.stringify({
//           message: input,
//           response: aiResponse,
//         }),
//       })

//       if (!saveAiResponse.ok) {
//         throw new Error("Failed to save AI response")
//       }

//       const aiMessage = {
//         id: `${Date.now()}-response`,
//         content: aiResponse,
//         role: "assistant" as const,
//         timestamp: new Date().toISOString(),
//       }

//       setMessages(prev => [...prev, aiMessage])
//     } catch (error) {
//       setError(error instanceof Error ? error.message : "Failed to send message")
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   if (!isAuthenticated) {
//     return (
//       <div className="flex items-center justify-center h-full">
//         <p className="text-muted-foreground">Please log in to start chatting</p>
//       </div>
//     )
//   }

//   return (
//     <div className="flex flex-col h-full">
//       <div className="flex justify-between items-center mb-4">
//         <h2 className="text-2xl font-bold">Chat with AI Assistant</h2>
//         <Dialog open={isAddingCard} onOpenChange={setIsAddingCard}>
//           <DialogTrigger asChild>
//             <Button variant="outline" size="sm">
//               <Plus className="h-4 w-4 mr-2" />
//               Add Card
//             </Button>
//           </DialogTrigger>
//           <DialogContent>
//             <DialogHeader>
//               <DialogTitle>Add New Card</DialogTitle>
//             </DialogHeader>
//             <form onSubmit={handleAddCard} className="space-y-4">
//               <div className="space-y-2">
//                 <Label htmlFor="cardNumber">Card Number</Label>
//                 <Input
//                   id="cardNumber"
//                   value={newCard.cardNumber}
//                   onChange={(e) => setNewCard(prev => ({ ...prev, cardNumber: e.target.value }))}
//                   placeholder="1234 5678 9012 3456"
//                   required
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="expiryDate">Expiry Date</Label>
//                 <Input
//                   id="expiryDate"
//                   value={newCard.expiryDate}
//                   onChange={(e) => setNewCard(prev => ({ ...prev, expiryDate: e.target.value }))}
//                   placeholder="MM/YY"
//                   required
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="cardType">Card Type</Label>
//                 <Input
//                   id="cardType"
//                   value={newCard.cardType}
//                   onChange={(e) => setNewCard(prev => ({ ...prev, cardType: e.target.value }))}
//                   placeholder="Visa, Mastercard, etc."
//                   required
//                 />
//               </div>
//               <Button type="submit" disabled={isLoading}>
//                 {isLoading ? (
//                   <>
//                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                     Adding...
//                   </>
//                 ) : (
//                   "Add Card"
//                 )}
//               </Button>
//             </form>
//           </DialogContent>
//         </Dialog>
//       </div>

//       {error && (
//         <Alert variant="destructive" className="mb-4">
//           <AlertDescription>{error}</AlertDescription>
//         </Alert>
//       )}

//       <ScrollArea ref={scrollRef} className="flex-1 pr-4">
//         <div className="space-y-4">
//           {messages.map((message) => (
//             <div
//               key={message.id}
//               className={`flex ${
//                 message.role === "user" ? "justify-end" : "justify-start"
//               }`}
//             >
//               <div
//                 className={`max-w-[80%] rounded-lg p-4 ${
//                   message.role === "user"
//                     ? "bg-primary text-primary-foreground"
//                     : "bg-muted"
//                 }`}
//               >
//                 <p className="text-sm">{message.content}</p>
//                 <p className="text-xs opacity-70 mt-1">
//                   {new Date(message.timestamp).toLocaleString()}
//                 </p>
//               </div>
//             </div>
//           ))}
//         </div>
//       </ScrollArea>

//       <form onSubmit={handleSubmit} className="mt-4">
//         <div className="flex gap-2">
//           <Input
//             value={input}
//             onChange={(e) => setInput(e.target.value)}
//             placeholder="Type your message..."
//             disabled={isLoading}
//           />
//           <Button type="submit" disabled={isLoading}>
//             {isLoading ? (
//               <Loader2 className="h-4 w-4 animate-spin" />
//             ) : (
//               <Send className="h-4 w-4" />
//             )}
//           </Button>
//         </div>
//       </form>

//       {cards.length > 0 && (
//         <Card className="mt-4">
//           <CardHeader>
//             <CardTitle>Saved Cards</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-4">
//               {cards.map((card) => (
//                 <div
//                   key={card.id}
//                   className="flex items-center justify-between p-4 border rounded-lg"
//                 >
//                   <div className="flex items-center space-x-4">
//                     <CreditCard className="h-6 w-6 text-primary" />
//                     <div>
//                       <div className="font-medium">{card.cardType}</div>
//                       <div className="text-sm text-muted-foreground">
//                         •••• {card.cardNumber.slice(-4)}
//                       </div>
//                     </div>
//                   </div>
//                   <div className="flex items-center space-x-4">
//                     <div className="text-sm text-muted-foreground">
//                       Expires {card.expiryDate}
//                     </div>
//                     <Button
//                       variant="destructive"
//                       size="sm"
//                       onClick={() => handleDeleteCard(card.id)}
//                     >
//                       Delete
//                     </Button>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </CardContent>
//         </Card>
//       )}
//     </div>
//   )
// }



"use client"

import React, { useEffect, useRef, useState, KeyboardEvent } from 'react';
import { Plane, Send, Loader2, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/auth-provider";
import ReactMarkdown from 'react-markdown';

interface Message {
  type: 'user' | 'bot' | 'typing';
  content?: string;
  timestamp?: Date;
}

export default function ChatPage() {
  const [input, setInput] = useState<string>('');
  const [isResetting, setIsResetting] = useState(false);
  const chatBoxRef = useRef<HTMLDivElement | null>(null);
  const { messages,suggestion, sendMessage: authSendMessage, resetChat: authResetChat } = useAuth();
  console.log("suggestion>>>>>>>>>>>>>>>>>",suggestion)
  const resetChat = async () => {
    setIsResetting(true);
    try {
      await authResetChat();
    } catch (error) {
      console.error('Error resetting chat:', error);
    } finally {
      setIsResetting(false);
    }
  };

  const sendMessage = async (): Promise<void> => {
    if (!input.trim()) return;
    
    const messageToSend = input;
    setInput(''); // Clear input immediately before sending
    
    try {
      await authSendMessage(messageToSend);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  // const formatMessage = (content: string) => {
  //   // Clean up the content by removing unwanted characters
  //   let cleanContent = content
  //     .replace(/\*\*\n\n\*/g, '')
  //     .replace(/\*\*/g, '')
  //     .replace(/\\n/g, '\n');
    
  //   // Simply return the cleaned content as plain text
  //   return cleanContent;
  // };

  // const formatMessage = (content: string): string => {
  //   let cleanContent = content
  //     // Replace markdown bullet points with clean list format
  //     .replace(/\* /g, '• ')
  //     // Remove extra bold formatting (double asterisks)
  //     .replace(/\*\*/g, '')
  //     // Replace escaped newline characters with actual newlines
  //     .replace(/\\n/g, '\n')
  //     // Remove extra newlines around bullet lists
  //     .replace(/\n\s*\n/g, '\n\n')
  //     // Trim any leading/trailing whitespace
  //     .trim();
  
  //   return cleanContent;
  // };
  
  const formatMessage = (content: string): string => {
    let cleanContent = content
      // Fix cases like "Booking ID:*•" by removing weird symbols
      .replace(/:\*\•/g, ':')         // remove *• after colon
      .replace(/\*•/g, '')            // remove stray *•
      .replace(/•\s*/g, '• ')         // ensure a space after bullet
      // Replace any remaining "* " with bullet points
      .replace(/\* /g, '• ')
      // Remove leftover markdown bold symbols
      .replace(/\*\*/g, '')
      // Replace escaped newline characters
      .replace(/\\n/g, '\n')
      // Normalize spacing between lines
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
  
    return cleanContent;
  };
  

  return (
    <div className="flex-1 overflow-y-auto p-4" ref={chatBoxRef}>
  {messages.length === 0 ? (
    <div className="h-full flex flex-col items-center justify-center text-center p-8">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="w-16 h-16 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center mb-4"
      >
        <Plane className="h-8 w-8 text-primary" />
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-bold mb-2"
      >
        Welcome to the{" "}
        <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          AI Flight Assistant
        </span>
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground max-w-md mb-8"
      >
        I can help you find flights, answer travel questions, and assist with booking. What can I help you with today?
      </motion.p>
    </div>
  ) : (
    <div className="space-y-4">
      <AnimatePresence initial={false}>
        {messages?.map((msg, idx) => {
          let parsedMessage: any = '';

          if (msg.type === 'bot') {
            try {
              const contentObj = typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content;
              parsedMessage = contentObj.response?.content || msg.content;
            } catch (err) {
              console.error('Failed to parse bot message:', err);
              parsedMessage = msg.content;
            }
          } else {
            parsedMessage = msg.content;
          }

          return msg.type === 'typing' ? (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex gap-3 max-w-[80%]">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Plane className="h-4 w-4 text-primary" />
                </div>
                <div className="rounded-lg p-4 bg-gradient-to-r from-muted to-muted/90">
                  <div className="flex items-center gap-2">
                    <motion.div
                      className="h-2 w-2 rounded-full bg-primary"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1 }}
                    />
                    <motion.div
                      className="h-2 w-2 rounded-full bg-primary"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1, delay: 0.2 }}
                    />
                    <motion.div
                      className="h-2 w-2 rounded-full bg-primary"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1, delay: 0.4 }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[80%] ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  msg.type === 'user' ? 'bg-gradient-to-r' : 'bg-primary/10'
                }`}>
                  {msg.type === 'user' ? (
                    <div className="h-4 w-4 bg-gradient-to-r">👤</div>
                  ) : (
                    <Plane className="h-4 w-4 bg-gradient-to-r" />
                  )}
                </div>
                <div className={`rounded-lg p-4 ${
                  msg.type === 'user'
                    ? 'bg-gradient-to-r from-primary to-secondary transition-all duration-300 rounded-md flex items-center justify-center'
                    : 'bg-gradient-to-r from-muted to-muted/90'
                }`}>
                  {msg.type === 'bot' ? (
                    <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">
                      {parsedMessage}
                    </ReactMarkdown>
                  ) : (
                    parsedMessage
                  )}
                  {msg.timestamp && (
                    <div className="text-xs opacity-70 mt-12">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  )}
</div>

  );
}
