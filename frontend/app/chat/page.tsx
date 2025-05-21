"use client"

import { useAuth } from "@/components/auth-provider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Loader2, MessageSquare, Plane, Plus, RotateCcw, Search, Send, Trash2 } from "lucide-react";
import React, { KeyboardEvent, useEffect, useRef, useState } from 'react';
import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

interface ChatMessage {
  type: 'user' | 'bot' | 'typing';
  content: string;
  timestamp: Date;
  id?: string;
}

interface ChatSession {
  _id: string;
  chat_name: string;
  messages: {
    messages: ChatMessage[];
  };
  created_at: Date;
  updated_at: Date;
  user_id: string;
}

interface MarkdownProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

interface CodeProps {
  className?: string;
  children: React.ReactNode;
  inline?: boolean;
}

export default function ChatPage() {
  const [input, setInput] = useState<string>('');
  const [isResetting, setIsResetting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const chatBoxRef = useRef<HTMLDivElement | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isBotLoading, setIsBotLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const { authenticateWithToken } = useAuth();

  const formatMessageContent = (content: string): string => {
    if (!content) return '';

    try {
      const parsed = JSON.parse(content);
      if (typeof parsed === 'object') {
        if (Array.isArray(parsed?.flights)) {
          // Convert flights data to markdown table format
          const tableHeader = '| Airline | Flight Number | Departure | Arrival | Duration | Price |\n|---------|--------------|-----------|---------|----------|-------|\n';
          const tableRows = parsed.flights.map((flight: any) => {
            return `| ${flight.airline} | ${flight.flightNumber} | ${flight.departureTime} | ${flight.arrivalTime} | ${flight.duration} | ₹${flight.price} |`;
          }).join('\n');
          return tableHeader + tableRows;
        }
        // For regular responses, return the content without code formatting
        return parsed.response?.content || parsed.content || parsed.message || content;
      }
      return content;
    } catch {
      // If parsing fails, process the content as a string
      // Only format actual code blocks (content between triple backticks)
      const lines = content.split('\n');
      let inCodeBlock = false;
      let formattedLines = [];

      for (const line of lines) {
        if (line.trim().startsWith('```')) {
          inCodeBlock = !inCodeBlock;
          formattedLines.push(line);
        } else if (inCodeBlock) {
          // Keep code block content as is
          formattedLines.push(line);
        } else {
          // For non-code content, don't apply code formatting
          formattedLines.push(line);
        }
      }

      return formattedLines.join('\n');
    }
  };

  const cleanMarkdownImageUrl = (url: string | undefined): string => {
    if (!url) return '';
    const match = url.match(/^!\[\]\((.*?)\)$/);
    return match ? match[1] : url;
  };

  const updateChatName = (sessionId: string, firstMessage: string) => {
    setChatHistory(prev => prev.map(chat => {
      if (chat._id === sessionId) {
        return {
          ...chat,
          chat_name: firstMessage.split(' ').slice(0, 4).join(' ') || 'New Chat'
        };
      }
      return chat;
    }));
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const getChatHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/api/sessions`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chat history');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch chat history');
      }

      const sessions = data.sessions.map((session: any) => ({
        ...session,
        created_at: new Date(session.created_at),
        updated_at: new Date(session.updated_at),
        messages: session.messages.messages.map((msg: any) => ({
          ...msg,
          content: formatMessageContent(msg.content),
          timestamp: new Date(msg.timestamp)
        }))
      }));

      setChatHistory(sessions);
      return sessions;
    } catch (error) {
      console.error('Error fetching chat history:', error);
      setChatHistory([]);
      // Show a user-friendly message in the chat
      setMessages(prev => [...prev, {
        type: 'bot',
        content: "I'm having trouble loading our conversation history. Please try refreshing the page.",
        timestamp: new Date()
      }]);
      return [];
    }
  };

  const switchChat = async (id: string, isInitialLoad = false) => {
    if (!id) return;

    setCurrentChatId(id);
    localStorage.setItem('currentChatId', id);
    setIsBotLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/session/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        throw new Error('Failed to fetch chat session');
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch chat session');
      }

      const session = data.session;
      const formattedMessages = session.messages.messages.map((msg: any) => ({
        ...msg,
        content: formatMessageContent(msg.content),
        timestamp: new Date(msg.timestamp)
      }));

      setMessages(formattedMessages);

      if (formattedMessages.length > 0 && !isInitialLoad) {
        const firstMessage = formattedMessages[0].content;
        updateChatName(id, firstMessage);
      }

      setChatHistory(prev => prev.map(chat =>
        chat._id === id
          ? { ...chat, messages: { messages: formattedMessages } }
          : chat
      ));
    } catch (error) {
      console.error("Error fetching chat session:", error);
      setMessages([{
        type: 'bot',
        content: "I'm having trouble loading this conversation. Please try again later.",
        timestamp: new Date()
      }]);
    } finally {
      setIsBotLoading(false);
    }
  };

  const sendMessage = async (): Promise<void> => {
    if (!input.trim() || isBotLoading) return;

    const messageToSend = input;
    setInput('');
    setIsBotLoading(true);

    const userMessage: ChatMessage = {
      type: 'user',
      content: messageToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessages(prev => [...prev, { type: 'typing', content: '', timestamp: new Date() }]);

    try {
      const request = {
        instructions: messageToSend,
        session_id: currentChatId
      };

      const res = await fetch(`${API_URL}/api/chats`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(request),
      });

      if (!res.ok) {
        throw new Error('Failed to send message');
      }

      const data = await res.json();

      // Remove typing indicator
      setMessages(prev => prev.filter(m => m.type !== 'typing'));




      // Add bot response
      if (data.responses && data.responses.length > 0) {
        const botMessage: ChatMessage = {
          type: 'bot',
          content: formatMessageContent(data.responses[0].content),
          timestamp: new Date()
        };

        setMessages(prev => [...prev, botMessage]);

        // Update chat history
        setChatHistory(prev => prev.map(chat =>
          chat._id === data.session_id
            ? {
              ...chat,
              messages: {
                messages: [...chat.messages.messages, userMessage, botMessage]
              },
              updated_at: new Date()
            }
            : chat
        ));

        // Update suggestions
        if (data.suggestions && Array.isArray(data.suggestions)) {
          setSuggestions(data.suggestions);
        } else {
          setSuggestions([]);
        }
      } else {
        throw new Error('No response received from server');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(m => m.type !== 'typing'));
      setMessages(prev => [...prev, {
        type: 'bot',
        content: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
        timestamp: new Date()
      }]);
      setSuggestions([]);
    } finally {
      setIsBotLoading(false);
    }
  };

  const addNewChat = async () => {
    try {
      const res = await fetch(`${API_URL}/api/new-chat`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || 'Failed to create new chat');
      }

      const newChat: ChatSession = {
        _id: data.session_id,
        chat_name: "New Chat",
        messages: { messages: [] },
        created_at: new Date(),
        updated_at: new Date(),
        user_id: data.user_id
      };

      setChatHistory(prev => [...prev, newChat]);
      setCurrentChatId(data.session_id);
      localStorage.setItem('currentChatId', data.session_id);
      setMessages([]);

      await getChatHistory();
    } catch (error) {
      console.error("New chat creation error:", error);
      setMessages([{
        type: 'bot',
        content: "I'm having trouble creating a new chat. Please try again in a moment.",
        timestamp: new Date()
      }]);
    }
  };

  const deleteChat = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/session/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to delete chat');
      }

      // Remove the chat from history
      setChatHistory(prev => prev.filter(chat => chat._id !== id));

      // If this was the current chat, clear the messages
      if (currentChatId === id) {
        setMessages([]);
        setCurrentChatId('');
        localStorage.removeItem('currentChatId');
      }

      return true;
    } catch (error) {
      console.error("Error deleting chat:", error);
      setMessages(prev => [...prev, {
        type: 'bot',
        content: "I'm having trouble deleting this conversation. Please try again later.",
        timestamp: new Date()
      }]);
      return false;
    }
  };

  const resetChat = async (): Promise<void> => {
    if (!currentChatId) return;

    setIsResetting(true);
    try {
      const res = await fetch(`${API_URL}/api/reset`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ session_id: currentChatId })
      });

      if (!res.ok) {
        throw new Error('Failed to reset chat');
      }

      setMessages([]);
      setSuggestions([]);
      await getChatHistory();
    } catch (error) {
      console.error("Reset chat error:", error);
      setMessages([{
        type: 'bot',
        content: "I'm having trouble resetting this conversation. Please try again in a moment.",
        timestamp: new Date()
      }]);
    } finally {
      setIsResetting(false);
    }
  };

  const handleToken = async () => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userData = params.get('user');

    if (token) {
      try {
        if (userData) {
          const user = JSON.parse(userData);
          localStorage.setItem('user', JSON.stringify(user));
        }

        const success = await authenticateWithToken(token);
        if (success) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (error) {
        console.error('Error authenticating with token:', error);
      }
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        await handleToken();
        const sessions = await getChatHistory();
        const storedChatId = localStorage.getItem('currentChatId');

        // Only create a new chat if there are no existing chats
        if (sessions.length === 0) {
          await addNewChat();
          return;
        }

        // Try to restore the last used chat
        if (storedChatId) {
          const chatExists = sessions.some((s: ChatSession) => s._id === storedChatId);
          if (chatExists) {
            await switchChat(storedChatId, true);
            return;
          }
        }

        // If no stored chat or stored chat doesn't exist, use the most recent chat
        await switchChat(sessions[0]._id, true);
      } catch (error) {
        console.error('Error initializing chat:', error);
        // Only create a new chat if initialization fails and there are no existing chats
        const sessions = await getChatHistory();
        if (sessions.length === 0) {
          await addNewChat();
        }
      }
    };

    init();
  }, [authenticateWithToken]);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    sendMessage();
  };

  const filteredConversations = chatHistory?.filter(conv =>
    conv.chat_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const markdownComponents: Components = {
    h1: ({ node, ...props }) => <h1 className="text-3xl font-extrabold mb-4 mt-6" {...props} />,
    h2: ({ node, ...props }) => <h2 className="text-2xl font-bold mb-3 mt-5" {...props} />,
    h3: ({ node, ...props }) => <h3 className="text-xl font-semibold mb-2 mt-4" {...props} />,
    // p: ({ node, children, ...props }) => {
    //   // Convert children to array for easier processing
    //   const childrenArray = React.Children.toArray(children);
      
    //   // If this paragraph contains a single code block, render just the code block
    //   if (childrenArray.length === 1) {
    //     const child = childrenArray[0];
    //     if (React.isValidElement(child) && child.type === 'code') {
    //       const codeProps = child.props as CodeProps;
    //       if (!codeProps.inline) {
    //         const match = /language-(\w+)/.exec(codeProps.className || '');
    //         const language = match ? match[1] : '';
    //         return (
    //           <div className="my-4">
    //             <pre className="bg-gray-900 text-white p-4 rounded-lg overflow-auto text-sm shadow-md">
    //               {language && (
    //                 <div className="text-xs text-gray-400 mb-2">
    //                   {language}
    //                 </div>
    //               )}
    //               <code className={`language-${language} block whitespace-pre-wrap break-words`}>
    //                 {codeProps.children}
    //               </code>
    //             </pre>
    //           </div>
    //         );
    //       }
    //     }
    //   }

    //   // For regular paragraphs, render as p
    //   return <p className="mb-4 text-base leading-relaxed" {...props}>{children}</p>;
    // },
    p: ({ node, children, ...props }) => {
  const childrenArray = React.Children.toArray(children);

  // Keep this block for code blocks...
  if (childrenArray.length === 1) {
    const child = childrenArray[0];
    if (React.isValidElement(child) && child.type === 'code') {
      const codeProps = child.props as CodeProps;
      if (!codeProps.inline) {
        const match = /language-(\w+)/.exec(codeProps.className || '');
        const language = match ? match[1] : '';
        return (
          <div className="my-4">
            <pre className="bg-gray-900 text-white p-4 rounded-lg overflow-auto text-sm shadow-md">
              {language && (
                <div className="text-xs text-gray-400 mb-2">
                  {language}
                </div>
              )}
              <code className={`language-${language} block whitespace-pre-wrap break-words`}>
                {codeProps.children}
              </code>
            </pre>
          </div>
        );
      }
    }
  }

  // ✅ Safely render full paragraph with children (including colons)
  return <p className="mb-4 text-base leading-relaxed" {...props}>{children}</p>;
},

    
    a: ({ node, ...props }) => (
      <a className="text-blue-600 underline hover:text-blue-800 transition font-medium" {...props} />
    ),
    strong: ({ node, ...props }) => (
      <strong className="font-bold text-black dark:text-white">{props.children}</strong>
    ),
    em: ({ node, ...props }) => (
      <em className="italic text-gray-600 dark:text-gray-400">{props.children}</em>
    ),
    blockquote: ({ node, ...props }) => (
      <blockquote className="border-l-4 pl-4 italic text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-md py-2">
        {props.children}
      </blockquote>
    ),
    code: ({ node, inline, className, children, ...props }: MarkdownProps) => {
      if (inline) {
        return (
          <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono text-pink-600 dark:text-pink-400">
            {children}
          </code>
        );
      }

      // For block code, render as a standalone block
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      return (
        <div className="my-4">
          <pre className="bg-gray-900 text-white p-4 rounded-lg overflow-auto text-sm shadow-md">
            {language && (
              <div className="text-xs text-gray-400 mb-2">
                {language}
              </div>
            )}
            <code className={`language-${language} block whitespace-pre-wrap break-words`}>
              {children}
            </code>
          </pre>
        </div>
      );
    },
    pre: ({ node, children, ...props }) => {
      // If pre contains a code element, extract its props and render directly
      if (React.isValidElement(children) && children.type === 'code') {
        const codeProps = children.props as CodeProps;
        const match = /language-(\w+)/.exec(codeProps.className || '');
        const language = match ? match[1] : '';
        return (
          <div className="my-4">
            <pre className="bg-gray-900 text-white p-4 rounded-lg overflow-auto text-sm shadow-md">
              {language && (
                <div className="text-xs text-gray-400 mb-2">
                  {language}
                </div>
              )}
              <code className={`language-${language} block whitespace-pre-wrap break-words`}>
                {codeProps.children}
              </code>
            </pre>
          </div>
        );
      }
      
      // Otherwise render as a regular pre
      return (
        <div className="my-4">
          <pre className="bg-gray-900 text-white p-4 rounded-lg overflow-auto text-sm shadow-md" {...props}>
            {children}
          </pre>
        </div>
      );
    },
    ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-3 space-y-1" {...props} />,
    ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-3 space-y-1" {...props} />,
    li: ({ node, ...props }) => <li className="mb-1">{props.children}</li>,
    table: ({ node, ...props }) => (
      <div className="overflow-x-auto my-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          {props.children}
        </table>
      </div>
    ),
    thead: ({ node, ...props }) => (
      <thead className="bg-gray-50 dark:bg-gray-800">
        {props.children}
      </thead>
    ),
    tbody: ({ node, ...props }) => (
      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
        {props.children}
      </tbody>
    ),
    tr: ({ node, ...props }) => (
      <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
        {props.children}
      </tr>
    ),
    th: ({ node, ...props }) => (
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
        {props.children}
      </th>
    ),
    td: ({ node, ...props }) => (
      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
        {props.children}
      </td>
    ),
    img: ({ node, ...props }: MarkdownProps) => (
      <div className="my-4">
        <img
          className="rounded-lg max-w-full h-auto shadow-sm border dark:border-gray-700"
          {...props}
          src={cleanMarkdownImageUrl(props.src)}
          alt={props.alt || 'Image'}
        />
      </div>
    ),
    span: ({ node, ...props }) => <span {...props} />
  };

  // Update the SuggestionButtons component
  const SuggestionButtons = ({ suggestions, onSuggestionClick }: { suggestions: string[], onSuggestionClick: (suggestion: string) => void }) => {
    if (!suggestions || suggestions.length === 0) return null;

    const handleSuggestionClick = async (suggestion: string) => {
      if (!suggestion.trim() || isBotLoading) return;

      // Set loading state at the start
      setIsBotLoading(true);

      const userMessage: ChatMessage = {
        type: 'user',
        content: suggestion,
        timestamp: new Date()
      };

      // Add user message and typing indicator
      setMessages(prev => [...prev, userMessage]);
      setMessages(prev => [...prev, { type: 'typing', content: '', timestamp: new Date() }]);

      try {
        const request = {
          instructions: suggestion,
          session_id: currentChatId
        };

        // Make the API request
        const res = await fetch(`${API_URL}/api/chats`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(request),
        });

        if (!res.ok) {
          throw new Error('Failed to send message');
        }

        const data = await res.json();

        // Only remove typing indicator after we have the response
        if (data.responses && data.responses.length > 0) {
          // Remove typing indicator
          setMessages(prev => prev.filter(m => m.type !== 'typing'));

          const botMessage: ChatMessage = {
            type: 'bot',
            content: formatMessageContent(data.responses[0].content),
            timestamp: new Date()
          };

          // Add bot response
          setMessages(prev => [...prev, botMessage]);

          // Update chat history
          setChatHistory(prev => prev.map(chat =>
            chat._id === data.session_id
              ? {
                ...chat,
                messages: {
                  messages: [...chat.messages.messages, userMessage, botMessage]
                },
                updated_at: new Date()
              }
              : chat
          ));

          // Update suggestions
          if (data.suggestions && Array.isArray(data.suggestions)) {
            setSuggestions(data.suggestions);
            console.log('Suggestions updated:', data.suggestions);
          } else {
            setSuggestions([]);
            console.warn('No suggestions in response or invalid format');
          }
        } else {
          throw new Error('No response received from server');
        }
      } catch (error) {
        console.error('Error sending message:', error);
        // Remove typing indicator on error
        setMessages(prev => prev.filter(m => m.type !== 'typing'));
        setMessages(prev => [...prev, {
          type: 'bot',
          content: 'Sorry, something went wrong. Please try again.',
          timestamp: new Date()
        }]);
        setSuggestions([]);
      } finally {
        // Only disable loading state after everything is complete
        // This ensures the loader stays active until we have a response or error
        setIsBotLoading(false);
      }
    };

    return (
      <div className="flex flex-wrap gap-2 mt-3">
        
        <div className="w-full text-sm text-gray-500 mb-2">You might want to ask...</div>
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            className={`bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-full px-4 py-2 text-sm font-medium transition-colors border border-indigo-200 flex items-center gap-2 ${isBotLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            onClick={() => handleSuggestionClick(suggestion)}
            type="button"
            disabled={isBotLoading}
          >
            {isBotLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            )}
            {suggestion}
          </button>
        ))}
      </div>
    );
  };


  const convertImageLinksToMarkdown = (text: string): string => {
    return text.replace(
      /(https?:\/\/[^\s]+\.(png|jpe?g|gif|webp|svg))/gi,
      '![]($1)'
    );
  };

  const cleanText = (text: string): string => {
    return text
      .replace(/(?<!\d),(?!\d)/g, '')
      .replace(/ *: */g, '')
      .replace(/ {2,}/g, ' ')
      .trim();
  };
  const allowInlineStyleSpans = (text: string): string => {
    return text.replace(
      /<span style="(.*?)">(.*?)<\/span>/gi,
      (_, style, inner) => {
        const safeStyle = style
          .split(';')
          .filter((rule: string) =>
            /^(color|background-color|font-weight|font-style|text-decoration)/i.test(rule.trim())
          )
          .join(';');
        return `<span style="${safeStyle}">${inner}</span>`;
      }
    );
  };

  return (
    <div className="max-h-screen flex flex-col bg-gradient-to-b from-background to-primary/5 dark:from-background dark:to-primary/10">
      <div className="flex-1 container mx-auto max-w-12xl px-4 py-8">
        <div className="h-[calc(100vh-8rem)] flex flex-col border-2 relative overflow-hidden rounded-lg bg-card">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 dark:from-primary/10 dark:via-transparent dark:to-secondary/10 pointer-events-none"></div>

          <div className="border-b p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Plane className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">AI Flight Assistant</h3>
              </div>
           
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-primary/10 hover:bg-primary/20 transition-colors"
                >
                  {isSidebarOpen ? (
                    <ChevronLeft className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  {isSidebarOpen ? "Hide History" : "Show History"}
                </button>
                <button
                  onClick={resetChat}
                  disabled={isResetting}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-primary/10 hover:bg-primary/20 transition-colors disabled:opacity-50"
                >
                  {isResetting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                  Reset Chat
                </button>
              </div>
            </div>
          </div>
         
          <div className="flex flex-1 overflow-hidden">
            
            <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} border-r transition-all duration-300 overflow-hidden`}>
              <div className="h-full flex flex-col">
                <div className="p-4 border-b">
                  <button
                    onClick={addNewChat}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors text-sm font-medium"
                  >
                    <Plus className="h-4 w-4" />
                    New Chat
                  </button>
                </div>

                <div className="p-2 border-b">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 pl-9 rounded-md bg-background border text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {filteredConversations?.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      {searchQuery ? 'No conversations match your search' : 'No conversations yet'}
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {filteredConversations?.map((conversation: ChatSession) => (
                        <div
                          key={conversation._id}
                          className={`p-2 rounded-md text-sm cursor-pointer hover:bg-primary/5 transition-colors flex items-center justify-between group ${conversation._id === currentChatId ? 'bg-primary/10' : ''}`}
                          onClick={() => switchChat(conversation._id)}
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <MessageSquare className="h-4 w-4 text-primary flex-shrink-0" />
                            <div className="truncate">{conversation.chat_name}</div>
                          </div>
                          <button
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-primary/10 rounded"
                            onClick={(e) => { e.stopPropagation(); deleteChat(conversation._id); }}
                          >
                            <Trash2 className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="p-2 border-t">
                  <button
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to delete all conversations? This cannot be undone.')) {
                        try {
                          // Delete all chats including the current one
                          const deletePromises = chatHistory.map(chat => deleteChat(chat._id));
                          await Promise.all(deletePromises);
                          
                          // Create a new chat after all deletions are complete
                          await addNewChat();
                        } catch (error) {
                          console.error("Error clearing all conversations:", error);
                          setMessages([{
                            type: 'bot',
                            content: "I'm having trouble clearing all conversations. Please try again.",
                            timestamp: new Date()
                          }]);
                        }
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md hover:bg-destructive/10 text-destructive transition-colors text-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear all conversations
                  </button>
                </div>
              </div>
            </div>
         
            <div className="flex-1 flex flex-col overflow-hidden">
            <Tabs
            // value={activeTab}
            // className="w-full"
            // onValueChange={(value) => {
            //   setActiveTab(value)
              // Update URL when tab changes
              // const url = new URL(window.location.href)
              // url.searchParams.set("tab", value)
              // window.history.pushState({}, "", url.toString())
            // }}
          >
          <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Flight Info</TabsTrigger>
              <TabsTrigger value="register">Trip Planner</TabsTrigger>
            </TabsList>
            </Tabs>
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
                  <>
                    <div className="space-y-4">
                      <AnimatePresence initial={false}>
                        {messages?.map((msg, idx) => {


                          let parsedMessage: string = '';

                          try {
                            const contentObj =
                              typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content;

                            if (typeof contentObj === 'object') {
                              parsedMessage =
                                contentObj.response?.content ||
                                contentObj.content ||
                                contentObj.message ||
                                msg.content;
                            } else {
                              parsedMessage = msg.content;
                            }
                          } catch {
                            parsedMessage = msg.content;
                          }

                          if (typeof parsedMessage === 'string') {
                            parsedMessage = convertImageLinksToMarkdown(parsedMessage);
                            parsedMessage = allowInlineStyleSpans(parsedMessage);
                            parsedMessage = cleanText(parsedMessage);
                          }

                          const isFlightResponse = () => {
                            try {
                              const parsed = JSON.parse(msg.content);
                              return Array.isArray(parsed?.flights);
                            } catch {
                              return false;
                            }
                          };

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
                                    {[0, 0.2, 0.4].map((delay, i) => (
                                      <motion.div
                                        key={i}
                                        className="h-2 w-2 rounded-full bg-primary"
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ repeat: Infinity, duration: 1, delay }}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ) : (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`max-w-[80%] ${msg.type === 'user' ? 'ml-4' : 'mr-4'}`}>
                                <div className={`rounded-lg p-4 ${msg.type === 'user'
                                    ? 'bg-gradient-to-r from-primary to-secondary text-white'
                                    : 'bg-gradient-to-r from-muted to-muted/90'
                                  }`}>
                                  {msg.type === 'bot' ? (
                                    isFlightResponse() ? (
                                      <FlightCardsRenderer flights={JSON.parse(msg.content).flights} />
                                    ) : (
                                      <div className="prose prose-sm dark:prose-invert max-w-none">
                                        <ReactMarkdown
                                          remarkPlugins={[remarkGfm]}
                                          rehypePlugins={[rehypeRaw]}
                                          components={markdownComponents}
                                          skipHtml={false}
                                          unwrapDisallowed={true}
                                          allowedElements={[
                                            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                                            'p', 'br', 'hr',
                                            'strong', 'em', 'del',
                                            'code', 'pre',
                                            'blockquote',
                                            'ul', 'ol', 'li',
                                            'table', 'thead', 'tbody', 'tr', 'th', 'td',
                                            'a', 'img',
                                            'div', 'span'
                                          ]}
                                        >
                                          {parsedMessage}
                                        </ReactMarkdown>
                                      </div>
                                    )
                                  ) : (
                                    parsedMessage
                                  )}

                                  {/* Add suggestions after bot messages */}
                                  {msg.type === 'bot' && idx === messages.length - 1 && (
                                    <SuggestionButtons
                                      suggestions={suggestions}
                                      onSuggestionClick={() => { }}
                                    />
                                  )}

                                  {msg.timestamp && (
                                    <div className="text-xs opacity-70 mt-2">
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
                  </>
                )}
              </div>

              <div className="border-t p-4 bg-gradient-to-r from-background to-primary/5 dark:from-background dark:to-primary/10">
                <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex w-full gap-2">
                  <textarea
                    className="flex-1 min-h-[40px] max-h-[120px] p-2 rounded-md border-2 focus-visible:ring-1 focus-visible:ring-primary/50 transition-all duration-200 resize-none bg-gradient-to-r from-background to-primary/5 dark:from-background dark:to-primary/10 text-foreground"
                    placeholder="Type your message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all duration-300 p-4 rounded-md disabled:opacity-50"
                  >
                    <Send className="h-4 w-12" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const FlightCardsRenderer = ({ flights }: { flights: any[] }) => {
  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <h2 className="text-xl font-bold mb-4">Flight Results</h2>

      <div className="bg-gray-800 p-4 rounded-lg mb-4 border border-gray-700">
        <div className="text-sm text-gray-400">New Delhi, India → Mumbai, India</div>
        <div className="text-sm text-gray-400">One-way • 20 Jun • 1 adult • Economy</div>
        <div className="text-sm text-gray-400">{flights.length} matching flights</div>
      </div>

      <div className="space-y-4">
        {flights.map((flight, index) => (
          <div
            key={index}
            className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex justify-between items-center shadow-sm hover:shadow-lg transition"
          >
            <div className="flex items-center gap-4">
              <div className="bg-gray-700 p-2 rounded-lg border border-gray-600">
                <img
                  src={flight.logoUrl || "/airline-logo.png"}
                  alt={flight.airline}
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div>
                <div className="text-lg font-semibold">{flight.airline}</div>
                <div className="text-sm text-gray-400">
                  {flight.departureTime} - {flight.arrivalTime}
                </div>
                <div className="text-sm text-gray-400">
                  {flight.flightNumber} • {flight.duration}
                </div>
              </div>
            </div>

            <div className="text-right">
              {index === 0 && (
                <>
                  <span className="bg-blue-600 px-2 py-1 text-xs rounded mr-2">Best</span>
                  <span className="bg-green-600 px-2 py-1 text-xs rounded mr-2">Cheapest</span>
                </>
              )}
              <div className="font-bold text-lg">₹{flight.price}</div>
              <div className="text-sm text-gray-400">Economy</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};



