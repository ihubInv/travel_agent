"use client"

import { useRouter } from "next/navigation"
import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"


type User = {
  id: string
  name: string
  email: string
  avatar?: string
}

type Message = {
  type: 'user' | 'bot' | 'typing'
  content: string
  timestamp: Date
}

// type ChatHistory = {
//   id: string
//   title: string
//   messages: Message[]
//   createdAt: Date
//   updatedAt: Date
// }

// type ChatHistoryGroup = {
//   title: string
//   chats: ChatHistory[]
// }

// API Response Types
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface LoginResponse {
  token: string;
  user: User;
}

interface Flight {
  id: string;
  from: string;
  to: string;
  date: string;
  passengers: number;
  class: string;
  status: string;
  created_at: string;
  airline: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
}

interface Card {
  id: string;
  cardNumber: string;
  expiryDate: string;
  cardType: string;
  holderName: string;
  isDefault: boolean;
}

interface ProfileStats {
  flights: number;
  chats: number;
  cards: number;
}

interface DummyData {
  flights: Flight[];
  chats: any;
  cards: Card[];
  stats: ProfileStats;
}

// API Request Types
interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

interface GoogleLoginRequest {
  credential: string;
}

interface ForgotPasswordRequest {
  email: string;
}

interface ResetPasswordRequest {
  token: string;
  password: string;
}

interface UpdateProfileRequest {
  name?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

interface ChatRequest {
  message: string;
  response?: string;
}

interface UserPreferences {
  flightPreferences: {
    pricePreference: string;
    stopPreference: string;
    departureTimePreference: string;
    mealPreference: string;
    classPreference: string;
    airlinePreference: string;
    flightTypePreference: string;
    automatedBooking: boolean;
  };
  passengers: Passenger[];
}

interface Passenger {
  id: string;
  name: string;
  passportNumber: string;
  nationality: string;
  dateOfBirth: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  // messages: Message[];
  // chatHistory: ChatHistory[];
  // currentChatId: string | null;
  isResetting: boolean;
  // suggestion: string[];

  
  // Authentication APIs
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  googleLogin: (credential: string) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (token: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  authenticateWithToken: (token: string) => Promise<boolean>;
  
  // Profile Management APIs
  getProfile: () => Promise<User>;
  updateProfile: (profileData: UpdateProfileRequest) => Promise<User>;
  uploadProfileImage: (imageFile: File) => Promise<string>;
  deleteAccount: () => Promise<boolean>;
  
  // Chat Management APIs
  saveChat: (message: string, response: string) => Promise<void>;
  // getChatHistory: () => Promise<ChatHistory[]>;
  // sendMessage: (message: string) => Promise<string>;
  // resetChat: () => Promise<void>;
  // addNewChat: () => void;
  // deleteChat: (chatId: string) => Promise<boolean>;
  // switchChat: (chatId: string) => void;
  
  // Flight Management APIs
  getFlights: () => Promise<Flight[]>;
  getUserFlights: (userId: string) => Promise<Flight[]>;
  getFlightById: (flightId: string) => Promise<Flight>;
  
  // Card Management APIs
  getCards: () => Promise<Card[]>;
  getCardById: (cardId: string) => Promise<Card>;
  addCard: (cardData: Partial<Card>) => Promise<Card>;
  updateCard: (cardId: string, cardData: Partial<Card>) => Promise<Card>;
  deleteCard: (cardId: string) => Promise<boolean>;
  
  // Preference Management APIs
  getPreferences: () => Promise<ApiResponse<UserPreferences>>;
  updatePreferences: (preferences: UserPreferences) => Promise<ApiResponse<UserPreferences>>;
  addPassenger: (passenger: Omit<Passenger, "id">) => Promise<ApiResponse<Passenger>>;
  updatePassenger: (passengerId: string, passenger: Passenger) => Promise<ApiResponse<Passenger>>;
  deletePassenger: (passengerId: string) => Promise<ApiResponse<void>>;
  
  // System APIs
  checkHealth: () => Promise<boolean>;
  // getDummyData: () => Promise<DummyData>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  // messages: [],
  // chatHistory: [],
  // currentChatId: null,
  isResetting: false,
  // suggestion: [],
  // setChatHistory:[],
  login: async () => false,
  register: async () => false,
  googleLogin: async () => false,
  forgotPassword: async () => ({ success: false, message: "" }),
  resetPassword: async () => ({ success: false, message: "" }),
  logout: () => {},
  authenticateWithToken: async () => false,
  getProfile: async () => ({ id: '', name: '', email: '' }),
  updateProfile: async () => ({ id: '', name: '', email: '' }),
  uploadProfileImage: async () => '',
  deleteAccount: async () => false,
  saveChat: async () => {},
  // getChatHistory: async () => [],
  // sendMessage: async () => '',
  // resetChat: async () => {},
  // addNewChat: () => {},
  // deleteChat: async () => false,
  // switchChat: () => {},
  getFlights: async () => [] as Flight[],
  getUserFlights: async () => [] as Flight[],
  getFlightById: async () => ({} as Flight),
  getCards: async () => [] as Card[],
  getCardById: async () => ({} as Card),
  addCard: async () => ({} as Card),
  updateCard: async () => ({} as Card),
  deleteCard: async () => false,
  checkHealth: async () => false,
  // getDummyData: async () => ({} as DummyData),
  getPreferences: async () => ({ success: false, data: undefined } as ApiResponse<UserPreferences>),
  updatePreferences: async () => ({ success: false, data: undefined } as ApiResponse<UserPreferences>),
  addPassenger: async () => ({ success: false, data: undefined } as ApiResponse<Passenger>),
  updatePassenger: async () => ({ success: false, data: undefined } as ApiResponse<Passenger>),
  deletePassenger: async () => ({ success: false, data: undefined } as ApiResponse<void>),
})

export const useAuth = () => useContext(AuthContext)

// Update the API_URL to ensure it's using the correct backend URL

const API_URL = process.env.NEXT_PUBLIC_API_URL 
// || "http://localhost:5000";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  // const [messages, setMessages] = useState<Message[]| any>([]); // ✅ default is an array
  const [isResetting, setIsResetting] = useState(false)
  // const [chatHistory, setChatHistory] = useState<ChatHistory[]>([])
  // const [suggestion, setSuggestions] = useState<string[]>([])
  // const [selectedChatId,setSelectedChatId]=useState<any>("")
  // const [currentChatId, setCurrentChatId] = useState<string>('current')
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    const storedUser = localStorage.getItem("user")
    if (token && storedUser) {
      try {
        // Set initial state from localStorage
        setUser(JSON.parse(storedUser))
        setIsAuthenticated(true)
        
        // Validate the token with the server
        const validateToken = async () => {
          try {
            const response = await fetch(`${API_URL}/api/profile`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (!response.ok) {
              // If token validation fails, clear auth state
              console.error("Token validation failed");
              localStorage.removeItem("token")
              localStorage.removeItem("user")
              setUser(null)
              setIsAuthenticated(false)
            }
          } catch (error) {
            console.error("Error validating token:", error);
            // Don't clear auth state on network errors
          }
        };
        
        validateToken();
      } catch (error) {
        console.error("Error parsing stored user:", error)
        localStorage.removeItem("token")
        localStorage.removeItem("user")
      }
    }
  }, [])

  // useEffect(() => {
  //   // Remove old localStorage chat history logic
  //   // Now chat history is loaded from backend
  //   // sendMessage(messages)
  //   getChatHistory();
  // }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token")
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
  }

  const handleApiResponse = async <T,>(response: Response, errorMessage?: string): Promise<T> => {
    try {
      // Log the response status and URL for debugging
      console.log(`API Response: ${response.status} - ${response.url}`);
      
      // Try to parse the response as JSON
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error(`Failed to parse JSON response from ${response.url}:`, jsonError);
        data = { error: errorMessage || 'API request failed' };
      }
      
      // Check if the response is not OK (status code >= 400)
      if (!response.ok) {
        // Log the error details
        console.error(`API Error (${response.url}):`, {
          status: response.status,
          statusText: response.statusText,
          data: data
        });
        
        // Throw a more descriptive error
        throw new Error(data.error || errorMessage || `API request failed with status ${response.status}`);
      }
      
      return data as T;
    } catch (error) {
      console.error(`API Error (${response.url}):`, error);
      throw error;
    }
  }

  // Authentication APIs
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log("Attempting login with email and password");
      
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (data.success && data.data?.token) {
        console.log("Login successful, setting authentication state");
        localStorage.setItem("token", data.data.token);
        localStorage.setItem("user", JSON.stringify(data.data.user));
        setIsAuthenticated(true);
        setUser(data.data.user);
        
        // Use router.push instead of window.location for better navigation
        router.push("/chat");
        return true;
      }
      
      console.error("Login failed:", data.error);
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const request: RegisterRequest = { name, email, password };
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      
      const data = await handleApiResponse<ApiResponse<LoginResponse>>(response, "Registration failed");
      
      if (data.success && data.data?.token) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        setIsAuthenticated(true);
        setUser(data.data.user);
        return true;
      }
      
      throw new Error(data.error || "Registration failed");
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const googleLogin = async (credential: string): Promise<boolean> => {
    try {
      console.log("Attempting Google login with credential");
      
      const response = await fetch(`${API_URL}/api/auth/google-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ credential }),
      });
      
      const data = await response.json();
      
      if (data.success && data.data?.token) {
        console.log("Google login successful, setting authentication state");
        localStorage.setItem("token", data.data.token);
        localStorage.setItem("user", JSON.stringify(data.data.user));
        setIsAuthenticated(true);
        setUser(data.data.user);
        
        // Use router.push instead of window.location for better navigation
        router.push("/chat");
        return true;
      }
      
      console.error("Google login failed:", data.error);
      return false;
    } catch (error) {
      console.error("Google login error:", error);
      return false;
    }
  };

  const forgotPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      console.log("Attempting to send password reset email to:", email)
      
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        console.log("Password reset email sent successfully")
        return { 
          success: true, 
          message: data.message || "If your email is registered, you will receive a password reset link" 
        }
      } else {
        console.error("Failed to send password reset email:", data.error)
        
        // In development mode, provide more detailed error information
        if (process.env.NODE_ENV === 'development') {
          return { 
            success: false, 
            message: `Failed to send reset email: ${data.error}. In development mode, check the backend logs for more details.` 
          }
        }
        
        return { 
          success: false, 
          message: "Failed to send password reset email. Please try again later." 
        }
      }
    } catch (error) {
      console.error("Error sending password reset email:", error)
      
      // In development mode, provide more detailed error information
      if (process.env.NODE_ENV === 'development') {
        return { 
          success: false, 
          message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}. In development mode, check the backend logs for more details.` 
        }
      }
      
      return { 
        success: false, 
        message: "An error occurred while processing your request. Please try again later." 
      }
    }
  }

  const resetPassword = async (token: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      console.log("Attempting to reset password with token")
      
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        console.log("Password reset successfully")
        return { 
          success: true, 
          message: data.message || "Password has been reset successfully" 
        }
      } else {
        console.error("Failed to reset password:", data.error)
        return { 
          success: false, 
          message: data.error || "Failed to reset password" 
        }
      }
    } catch (error) {
      console.error("Error resetting password:", error)
      return { 
        success: false, 
        message: "An error occurred while processing your request" 
      }
    }
  }

  // Profile Management APIs
  const getProfile = async (): Promise<User> => {
    const response = await fetch(`${API_URL}/api/profile`, {
      headers: getAuthHeaders(),
    });
    const data = await handleApiResponse<ApiResponse<User>>(response, "Failed to fetch profile");
    return data.data!;
  };

  const updateProfile = async (profileData: UpdateProfileRequest): Promise<User> => {
    const response = await fetch(`${API_URL}/api/update-profile`, {
      method: 'PUT',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData),
    });
    const data = await handleApiResponse<ApiResponse<User>>(response, "Failed to update profile");
    return data.data!;
  };

  const uploadProfileImage = async (imageFile: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      
      const response = await fetch(`${API_URL}/api/upload-profile-image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });
      
      const result = await handleApiResponse<ApiResponse<{ imageUrl: string }>>(response, "Failed to upload profile image");
      
      if (!result.success) {
        throw new Error(result.error || "Failed to upload profile image");
      }
      
      // Update user data in localStorage
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({
        ...currentUser,
        avatar: result.data!.imageUrl
      }));
      
      return result.data!.imageUrl;
    } catch (error) {
      console.error("Error uploading profile image:", error);
      throw error;
    }
  };

  const deleteAccount = async (): Promise<boolean> => {
    const response = await fetch(`${API_URL}/api/delete-account`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await handleApiResponse<ApiResponse<void>>(response, "Failed to delete account");
    if (data.success) {
      logout();
      return true;
    }
    return false;
  };

  // Chat Management APIs
  const saveChat = async (message: string, response: string): Promise<void> => {
    try {
      if (!user) {
        throw new Error("User not authenticated");
      }

      const request: ChatRequest = { message, response };
      const apiResponse = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(request),
      });

      await handleApiResponse<ApiResponse<void>>(apiResponse, "Failed to save chat");
    } catch (error) {
      console.error("Save chat error:", error);
      throw error;
    }
  };

  // const getChatHistory = async (): Promise<ChatHistory[]> => {
  //   try {
  //     const response = await fetch(`${API_URL}/api/chats`, {
  //       method: 'GET',
  //       headers: getAuthHeaders(),
  //     });
  //     const data = await response.json();
  //     // Ensure data is always an array
  //     const sessions = Array.isArray(data) ? data : [];
  //     setChatHistory(sessions);
  //     return sessions;
  //   } catch (error) {
  //     console.error("Error fetching chat history:", error);
  //     setChatHistory([]); // Always set to an array
  //     return [];
  //   }
  // };

  // const getChatHistory = async () => {
  //   debugger
    
  //   try {
  //     const response = await fetch(`${API_URL}/api/sessions`, {
  //       method: 'GET',
  //       headers: getAuthHeaders(),
  //     });
  //     if (!response.ok) {
  //       const errorData = await response.json();
  //       throw new Error(errorData.detail || 'Failed to fetch chat history');
  //     }
  //     const data = await response.json();
  //     const sessions = Array.isArray(data) ? data : [];
  //     setChatHistory(sessions);
  //     console.log("data", sessions);
  //     return sessions;
  //   } catch (error) {
  //     console.error('Error fetching chat history:', error);
  //     setChatHistory([]);
  //     throw error;
  //   }
  // }

  // const sendMessage = async (message: string): Promise<string> => {
  //   if (!message.trim()) return "";
  
  //   // ✅ Add user's message to chat window
  //   setMessages((prev: Message[]) => [...prev, { type: 'user', content: message }]);
  
  //   try {
  //     const request: any = { instructions: message };
  //     const response = await fetch(`${API_URL}/api/chats`, {
  //       method: 'POST',
  //       headers: getAuthHeaders(),
  //       body: JSON.stringify(request),
  //     });
  
  //     const raw = await response.json();
  //     console.log("✅ API response:", raw);
  
  //     // ✅ Extract first response content safely
  //     const content = raw?.responses?.[0]?.content || "No response received.";
  //     setSelectedChatId(raw?.session_id)
      
  //     // ✅ Add bot's response to chat window
  //     setMessages((prev: Message[]) => [...prev, { type: 'bot', content }]);
  //   //  console.log(">>>>>>",raw?.suggestions)
  //     // ✅ Set suggestions if available
  //     if (raw?.suggestions) {
  //       setSuggestions(raw.suggestions);
  //     } else {
  //       setSuggestions([]);
  //     }
  
  //     return content;
  //   } catch (error) {
  //     console.error("Send message error:", error);
  //     throw error;
  //   }
  // };
  
  // const resetChat = async (): Promise<void> => {
  //   debugger
  //   setIsResetting(true);
  //   try {
  //     const res = await fetch(`${API_URL}/api/reset`, {
  //       method: 'POST',
  //       headers: getAuthHeaders(),
  //       body: JSON.stringify({session_id:selectedChatId})
  //     });
  
  //     const data = await res.json();
  //     console.log("reset", data);
  
  //     if (!res.ok) {
  //       console.error("❌ Failed to reset chat:", data?.message || res.statusText);
  //       return;
  //     }
  
  //     console.log("✅ Chat reset:", data.message);
  
  //     // Clear frontend chat state
  //     setMessages([]);
  //     setSuggestions([]);
  //   } catch (error) {
  //     console.error("❌ Reset chat error:", error);

  //   } finally {
  //     setIsResetting(false);
  //   }
  // };
  
  // Flight Management APIs
  const getFlights = async (): Promise<Flight[]> => {
    try {
      // First check if the API is available
      const healthCheck = await fetch(`${API_URL}/api/health`).catch(() => null);
      if (!healthCheck || !healthCheck.ok) {
        console.warn("API health check failed, using fallback flight data");
        return getFallbackFlightData();
      }

      // Use the dummy-data endpoint instead of the non-existent flights endpoint
      const response = await fetch(`${API_URL}/api/dummy-data`, {
        method: 'GET',
        headers: getAuthHeaders(),
      }).catch(error => {
        console.error("Error fetching dummy data:", error);
        throw new Error("Network error while fetching dummy data");
      });
      
      try {
        const result = await handleApiResponse<ApiResponse<DummyData>>(response, "Failed to fetch dummy data");
        
        if (!result.success) {
          throw new Error(result.error || "Failed to fetch dummy data");
        }
        
        // Return the flights from the dummy data
        return result.data?.flights || [];
      } catch (error) {
        console.error("Error processing dummy data:", error);
        return getFallbackFlightData();
      }
    } catch (error) {
      console.error("Error in getFlights:", error);
      return getFallbackFlightData();
    }
  };

  // Helper function to provide fallback flight data
  const getFallbackFlightData = (): Flight[] => {
    return [
      {
        id: "1",
        from: "New York",
        to: "London",
        date: "2023-06-15",
        passengers: 2,
        class: "Business",
        status: "Confirmed",
        created_at: "2023-05-10T10:30:00Z",
        airline: "Delta",
        flightNumber: "DL123",
        departureTime: "10:30 AM",
        arrivalTime: "10:30 PM",
        duration: "7h 0m",
        price: 850
      },
      {
        id: "2",
        from: "London",
        to: "Paris",
        date: "2023-07-20",
        passengers: 1,
        class: "Economy",
        status: "Pending",
        created_at: "2023-05-15T14:45:00Z",
        airline: "British Airways",
        flightNumber: "BA456",
        departureTime: "2:45 PM",
        arrivalTime: "5:15 PM",
        duration: "1h 30m",
        price: 150
      }
    ];
  };

  const getUserFlights = async (userId: string): Promise<Flight[]> => {
    try {
      // First check if the API is available
      const healthCheck = await fetch(`${API_URL}/api/health`).catch(() => null);
      if (!healthCheck || !healthCheck.ok) {
        console.warn("API health check failed, using fallback flight data");
        return getFallbackFlightData();
      }

      // Use the dummy-data endpoint instead of the non-existent user/flights endpoint
      const response = await fetch(`${API_URL}/api/dummy-data`, {
        method: 'GET',
        headers: getAuthHeaders(),
      }).catch(error => {
        console.error("Error fetching dummy data:", error);
        throw new Error("Network error while fetching dummy data");
      });
      
      try {
        const result = await handleApiResponse<ApiResponse<DummyData>>(response, "Failed to fetch dummy data");
        
        if (!result.success) {
          throw new Error(result.error || "Failed to fetch dummy data");
        }
        
        // Return the flights from the dummy data
        return result.data?.flights || [];
      } catch (error) {
        console.error("Error processing dummy data:", error);
        return getFallbackFlightData();
      }
    } catch (error) {
      console.error("Error in getUserFlights:", error);
      return getFallbackFlightData();
    }
  };

  const getFlightById = async (flightId: string): Promise<Flight> => {
    try {
      // First check if the API is available
      const healthCheck = await fetch(`${API_URL}/api/health`).catch(() => null);
      if (!healthCheck || !healthCheck.ok) {
        console.warn("API health check failed, using fallback flight data");
        return {
          ...getFallbackFlightData()[0],
          id: flightId
        };
      }

      // Try the correct endpoint - note that we're removing the /api prefix
      const response = await fetch(`${API_URL}/api/flights/${flightId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      }).catch(error => {
        console.error("Error fetching flight by ID:", error);
        throw new Error("Network error while fetching flight by ID");
      });
      
      try {
        const result = await handleApiResponse<ApiResponse<Flight>>(response, "Failed to fetch flight");
        
        if (!result.success) {
          throw new Error(result.error || "Failed to fetch flight");
        }
        
        return result.data!;
      } catch (error) {
        console.error("Error processing flight data:", error);
        return {
          ...getFallbackFlightData()[0],
          id: flightId
        };
      }
    } catch (error) {
      console.error("Error in getFlightById:", error);
      return {
        ...getFallbackFlightData()[0],
        id: flightId
      };
    }
  };

  // Card Management APIs
  const getCards = async (): Promise<Card[]> => {
    try {
      const response = await fetch(`${API_URL}/api/cards`, {
        headers: getAuthHeaders(),
      });
      
      const result = await handleApiResponse<ApiResponse<Card[]>>(response, "Failed to fetch cards");
      
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch cards");
      }
      
      return result.data || [];
    } catch (error) {
      console.error("Error fetching cards:", error);
      return [];
    }
  };

  const getCardById = async (cardId: string): Promise<Card> => {
    try {
      const response = await fetch(`${API_URL}/api/cards/${cardId}`, {
        headers: getAuthHeaders(),
      });
      
      return await handleApiResponse<Card>(response, "Failed to fetch card");
    } catch (error) {
      console.error("Error fetching card:", error);
      throw error;
    }
  };

  const addCard = async (cardData: Partial<Card>): Promise<Card> => {
    try {
      const response = await fetch(`${API_URL}/api/cards`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cardData),
      });
      
      const result = await handleApiResponse<ApiResponse<Card>>(response, "Failed to add card");
      
      if (!result.success) {
        throw new Error(result.error || "Failed to add card");
      }
      
      return result.data!;
    } catch (error) {
      console.error("Error adding card:", error);
      throw error;
    }
  };

  const updateCard = async (cardId: string, cardData: Partial<Card>): Promise<Card> => {
    try {
      const response = await fetch(`${API_URL}/api/cards/${cardId}`, {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cardData),
      });
      
      const result = await handleApiResponse<ApiResponse<Card>>(response, "Failed to update card");
      
      if (!result.success) {
        throw new Error(result.error || "Failed to update card");
      }
      
      return result.data!;
    } catch (error) {
      console.error("Error updating card:", error);
      throw error;
    }
  };

  const deleteCard = async (cardId: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/cards/${cardId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      
      const result = await handleApiResponse<ApiResponse<null>>(response, "Failed to delete card");
      
      if (!result.success) {
        throw new Error(result.error || "Failed to delete card");
      }
      
      return true;
    } catch (error) {
      console.error("Error deleting card:", error);
      throw error;
    }
  };

  // System APIs
  const checkHealth = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/health`)
      const data = await handleApiResponse<ApiResponse<{ status: string }>>(response, "Health check failed")
      return data.success && data.data?.status === "ok"
    } catch (error) {
      console.error('Health check error:', error)
      return false
    }
  }

  // const getDummyData = async (): Promise<DummyData> => {
  //   const response = await fetch(`${API_URL}/api/dummy-data`, {
  //     headers: getAuthHeaders(),
  //   })
  //   const data = await handleApiResponse<ApiResponse<DummyData>>(response, "Failed to fetch dummy data")
  //   return data.data!
  // }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/")
  }

//   const addNewChat = async () => {
//   try {
//     const res = await fetch(`${API_URL}/api/new-chat`, {
//         method: 'POST',
//         headers: getAuthHeaders(),
       
//       });

//     const data = await res.json();
//     console.log("new chat", data);

//     if (!res.ok) {
//       console.error("❌ Failed to create new chat:", data?.message || res.statusText);
//       return;
//     }

//     // Build frontend chat history item using session_id from backend
//     // const newChat: ChatHistory = {
//     //   id: data.session_id,
//     //   title: "New Chat",
//     //   messages: [],
//     //   createdAt: new Date(),
//     //   updatedAt: new Date(),
//     // };

//     // setChatHistory(prev => [newChat, ...prev]);
//     setCurrentChatId(data.session_id);
//     localStorage.setItem('currentChatId', data.session_id);
//     setMessages([]);
//   } catch (error) {
//     console.error("❌ New chat creation error:", error);
//   }
// };

  // const deleteChat = async (id: string): Promise<boolean> => {
  //   debugger
  //   const response = await fetch(`${API_URL}/api/session/${id}`, {
  //     method: 'DELETE',
  //     headers: getAuthHeaders(),
  //   });
  //   const result = await response.json();
  
  //   if (response.ok) {
  //     const filteredChats = Array.isArray(chatHistory) ? chatHistory.filter(chat => chat.id !== id) : [];
  //     // setChatHistory(filteredChats);
  //     console.log("Deleted:", result.deleted);
  //     return true;
  //   } else {
  //     console.error("Error:", result.error);
  //     return false;
  //   }
  // };

  
  
  // const switchChat = async (id: string, isInitialLoad = false) => {
  //   debugger
  //   setCurrentChatId(id);
  //   localStorage.setItem('currentChatId', id);
  //   try {
  //     const res = await fetch(`${API_URL}/api/session/${id}`, {
  //       method: 'GET',
  //       headers: getAuthHeaders(),
  //     });
  //     if (res.ok) {
  //       const data = await res.json();
  //       console.log(data)
  //       setMessages(data.messages || []);
  //     } else {
  //       setMessages([]);
  //     }
  //   } catch (error) {
  //     setMessages([]);
  //   }
  // };

  // const switchChat = async (id: string, isInitialLoad = false) => {
  //   setCurrentChatId(id);
  //   localStorage.setItem('currentChatId', id);
  //   try {
  //     const res = await fetch(`${API_URL}/api/session/${id}`, {
  //       method: 'GET',
  //       headers: getAuthHeaders(),
  //     });
  //     if (res.ok) {
  //       const data = await res.json();
  //       console.log(data);
  //       setMessages(data.messages.messages || []);
  //     } else {
  //       console.warn("Failed to fetch chat history, status:", res.status);
  //       setMessages([]);
  //     }
  //   } catch (error) {
  //     console.error("Error fetching chat session:", error);
  //     setMessages([]);
  //   }
  // };
  

  // Add the new authenticateWithToken function
  const authenticateWithToken = async (token: string): Promise<boolean> => {
    try {
      // Store the token in localStorage
      localStorage.setItem('token', token);

      // Fetch user data from the profile endpoint
      const response = await fetch(`${API_URL}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setIsAuthenticated(true);
        return true;
      } else {
        // If the token is invalid, remove it from localStorage
        localStorage.removeItem('token');
        return false;
      }
    } catch (error) {
      console.error('Error authenticating with token:', error);
      localStorage.removeItem('token');
      return false;
    }
  };

  // Preference Management APIs
  const getPreferences = async (): Promise<ApiResponse<UserPreferences>> => {
    try {
      const response = await fetch(`${API_URL}/api/preferences`, {
        headers: getAuthHeaders(),
      });
      return await handleApiResponse<ApiResponse<UserPreferences>>(response, "Failed to fetch preferences");
    } catch (error) {
      console.error("Error fetching preferences:", error);
      return { success: false, error: "Failed to fetch preferences" };
    }
  };

  const updatePreferences = async (preferences: UserPreferences): Promise<ApiResponse<UserPreferences>> => {
    try {
      const response = await fetch(`${API_URL}/api/preferences`, {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferences),
      });
      return await handleApiResponse<ApiResponse<UserPreferences>>(response, "Failed to update preferences");
    } catch (error) {
      console.error("Error updating preferences:", error);
      return { success: false, error: "Failed to update preferences" };
    }
  };

  const addPassenger = async (passenger: Omit<Passenger, "id">): Promise<ApiResponse<Passenger>> => {
    try {
      console.log("Adding passenger:", passenger);
      
      const response = await fetch(`${API_URL}/api/preferences/passengers`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(passenger),
      });
      
      // Log the response status and headers for debugging
      console.log(`Passenger API Response: ${response.status} - ${response.url}`);
      console.log("Response headers:", Object.fromEntries([...response.headers.entries()]));
      
      // Check if the response is empty
      const responseText = await response.text();
      console.log("Response text:", responseText);
      
      if (!responseText) {
        console.error("Empty response from passenger API");
        return { 
          success: false, 
          error: "Empty response from server" 
        };
      }
      
      // Try to parse the response as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        console.error("Failed to parse JSON response:", jsonError);
        return { 
          success: false, 
          error: "Invalid JSON response from server" 
        };
      }
      
      // Check if the response is not OK (status code >= 400)
      if (!response.ok) {
        console.error("Passenger API Error:", {
          status: response.status,
          statusText: response.statusText,
          data: data
        });
        
        return { 
          success: false, 
          error: data.error || `API request failed with status ${response.status}` 
        };
      }
      
      return { 
        success: true, 
        data: data.data || data 
      };
    } catch (error) {
      console.error("Error adding passenger:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to add passenger" 
      };
    }
  };

  const updatePassenger = async (passengerId: string, passenger: Passenger): Promise<ApiResponse<Passenger>> => {
    try {
      const response = await fetch(`${API_URL}/api/preferences/passengers/${passengerId}`, {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(passenger),
      });
      return await handleApiResponse<ApiResponse<Passenger>>(response, "Failed to update passenger");
    } catch (error) {
      console.error("Error updating passenger:", error);
      return { success: false, error: "Failed to update passenger" };
    }
  };

  const deletePassenger = async (passengerId: string): Promise<ApiResponse<void>> => {
    try {
      const response = await fetch(`${API_URL}/api/preferences/passengers/${passengerId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      return await handleApiResponse<ApiResponse<void>>(response, "Failed to delete passenger");
    } catch (error) {
      console.error("Error deleting passenger:", error);
      return { success: false, error: "Failed to delete passenger" };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        // messages,
        // chatHistory,
        // currentChatId,
        isResetting,
        // suggestion,
        login,
        register,
        googleLogin,
        logout,
        forgotPassword,
        resetPassword,
        saveChat,
        // getChatHistory,
        // sendMessage,
        // resetChat,
        // addNewChat,
        // deleteChat,
        // switchChat,
        getProfile,
        updateProfile,
        uploadProfileImage,
        deleteAccount,
        getFlights,
        getUserFlights,
        getFlightById,
        getCards,
        getCardById,
        addCard,
        updateCard,
        deleteCard,
        checkHealth,
        // getDummyData,
        authenticateWithToken,
        getPreferences,
        updatePreferences,
        addPassenger,
        updatePassenger,
        deletePassenger,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
} 