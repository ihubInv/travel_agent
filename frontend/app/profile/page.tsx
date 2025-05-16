"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Loader2, User, CreditCard, Edit, Plus, Trash2, MessageSquare, Plane, Settings } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPreferences } from "./components/user-preferences"

type ProfileStats = {
  flights: number
  chats: number
  cards: number
}

type CardDetail = {
  id: string
  cardNumber: string
  expiryDate: string
  cardType: string
  created_at?: string
}

type ChatHistory = {
  id: string
  message: string
  response: string
  created_at: string
}

type Flight = {
  id: string
  from: string
  to: string
  date: string
  passengers: number
  class: string
  status: string
  created_at: string
}

export default function ProfilePage() {
  const { user, isAuthenticated, getProfile, updateProfile, uploadProfileImage, deleteAccount, getCards, addCard, updateCard, deleteCard, getChatHistory, deleteChat, getFlights } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("profile")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [isEditing, setIsEditing] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [profileStats, setProfileStats] = useState<ProfileStats>({
    flights: 0,
    chats: 0,
    cards: 0
  })
  const [cards, setCards] = useState<CardDetail[]>([])
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([])
  const [flights, setFlights] = useState<Flight[]>([])
  
  // Card dialog states
  const [isCardDialogOpen, setIsCardDialogOpen] = useState(false)
  const [cardFormData, setCardFormData] = useState({
    cardNumber: "",
    expiryDate: "",
    cardType: "Visa"
  })
  const [editingCardId, setEditingCardId] = useState<string | null>(null)
  
  // Delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteItemType, setDeleteItemType] = useState<"card" | "chat" | "account" | null>(null)
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    // Check if authentication has been initialized
    const checkAuth = () => {
      // If we have a token in localStorage but isAuthenticated is false,
      // we need to wait for the auth state to be properly initialized
      const token = localStorage.getItem("token")
      if (token && !isAuthenticated) {
        // Wait a bit longer for auth to initialize
        setTimeout(checkAuth, 100)
        return
      }
      
      setAuthChecked(true)
      
      // Only redirect if we've checked auth and there's no token
      if (!isAuthenticated && !token) {
        router.push("/login")
        return
      }

      if (user) {
        fetchUserData()
        setFormData(prev => ({
          ...prev,
          name: user.name || "",
          email: user.email || "",
        }))
      }
    }
    
    checkAuth()
  }, [isAuthenticated, user])

  const fetchUserData = async () => {
    try {
      const profile = await getProfile()
      if (profile) {
        setProfileImage(profile.avatar || null)
        // Fetch additional data
        const [flightsData, chatsData, cardsData] = await Promise.all([
          getFlights(),
          getChatHistory(),
          getCards()
        ])
        setProfileStats({
          flights: flightsData.length,
          chats: chatsData.length,
          cards: cardsData.length
        })
      }
      setIsLoading(false)
    } catch (err) {
      setError("Failed to load profile data")
      setIsLoading(false)
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)
    setSuccess(null)

    try {
      const imageUrl = await uploadProfileImage(file)
      setProfileImage(imageUrl)
      setSuccess("Profile picture updated successfully")
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to upload profile picture")
    } finally {
      setIsUploading(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (formData.newPassword !== formData.confirmPassword) {
        throw new Error("New passwords do not match")
      }

      const updatedUser = await updateProfile({
        name: formData.name,
        email: formData.email,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      })
      
      setSuccess("Profile updated successfully")
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCardInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCardFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }
  
  const handleCardTypeChange = (value: string) => {
    setCardFormData(prev => ({
      ...prev,
      cardType: value,
    }))
  }
  
  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const newCard = await addCard(cardFormData)
      setCards(prev => [...prev, newCard])
      setSuccess("Card added successfully")
      setIsCardDialogOpen(false)
      setCardFormData({
        cardNumber: "",
        expiryDate: "",
        cardType: "Visa"
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add card")
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleEditCard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCardId) return
    
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const updatedCard = await updateCard(editingCardId, cardFormData)
      setCards(prev => prev.map(card => 
        card.id === editingCardId ? updatedCard : card
      ))
      setSuccess("Card updated successfully")
      setIsCardDialogOpen(false)
      setEditingCardId(null)
      setCardFormData({
        cardNumber: "",
        expiryDate: "",
        cardType: "Visa"
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update card")
    } finally {
      setIsLoading(false)
    }
  }
  
  const openEditCardDialog = (card: CardDetail) => {
    setEditingCardId(card.id)
    setCardFormData({
      cardNumber: card.cardNumber,
      expiryDate: card.expiryDate,
      cardType: card.cardType
    })
    setIsCardDialogOpen(true)
  }
  
  const openDeleteDialog = (type: "card" | "chat" | "account", id?: string) => {
    setDeleteItemType(type)
    setDeleteItemId(id || null)
    setIsDeleteDialogOpen(true)
  }
  
  const handleDeleteCard = async () => {
    if (!deleteItemId) return
    
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await deleteCard(deleteItemId)
      setCards(prev => prev.filter(card => card.id !== deleteItemId))
      setSuccess("Card deleted successfully")
      setIsDeleteDialogOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete card")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteChat = async () => {
    if (!deleteItemId) return
    
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await deleteChat(deleteItemId)
      setChatHistory(prev => prev.filter(chat => chat.id !== deleteItemId))
      setSuccess("Chat deleted successfully")
      setIsDeleteDialogOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete chat")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await deleteAccount()
      router.push("/")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete account")
    } finally {
      setIsLoading(false)
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Manage your account settings and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </div>
                {isEditing && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        value={formData.currentPassword}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        value={formData.newPassword}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                      />
                    </div>
                  </>
                )}
                <div className="flex justify-end space-x-2">
                  {isEditing ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button type="button" onClick={() => setIsEditing(true)}>
                      Edit Profile
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        )
      case "flights":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Flight History</CardTitle>
              <CardDescription>View your past and upcoming flights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {flights.map((flight) => (
                  <Card key={flight.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{flight.from} → {flight.to}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(flight.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{flight.class}</p>
                          <p className="text-sm text-muted-foreground">
                            {flight.passengers} passenger{flight.passengers !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      case "cards":
        return (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Payment Cards</CardTitle>
                <CardDescription>Manage your saved payment methods</CardDescription>
              </div>
              <Button onClick={() => setIsCardDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Card
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cards.map((card) => (
                  <Card key={card.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">**** **** **** {card.cardNumber.slice(-4)}</p>
                          <p className="text-sm text-muted-foreground">
                            Expires {card.expiryDate}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditCardDialog(card)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteDialog("card", card.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      case "chats":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Chat History</CardTitle>
              <CardDescription>View your past conversations with the AI assistant</CardDescription>
            </CardHeader>
            <CardContent>
              {chatHistory.length === 0 ? (
                <p className="text-muted-foreground">No chat history found.</p>
              ) : (
                <div className="space-y-4">
                  {chatHistory.map((chat) => (
                    <Card key={chat.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <p className="font-medium">{chat.message}</p>
                            <p className="text-sm text-muted-foreground">{new Date(chat.created_at).toLocaleDateString()}</p>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => openDeleteDialog("chat", chat.id)}
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
        )
      case "preferences":
        return <UserPreferences />
      default:
        return null
    }
  }

  if (isLoading || !authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profileImage || ""} />
                  <AvatarFallback>
                    {user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h2 className="text-xl font-semibold">{user?.name}</h2>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <nav className="space-y-2">
                <Button
                  variant={activeTab === "profile" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handleTabChange("profile")}
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Button>
                <Button
                  variant={activeTab === "flights" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handleTabChange("flights")}
                >
                  <Plane className="mr-2 h-4 w-4" />
                  Flights
                </Button>
                <Button
                  variant={activeTab === "cards" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handleTabChange("cards")}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Payment Cards
                </Button>
                <Button
                  variant={activeTab === "chats" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handleTabChange("chats")}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Chat History
                </Button>
                <Button
                  variant={activeTab === "preferences" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handleTabChange("preferences")}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Preferences
                </Button>
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={() => openDeleteDialog("account")}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Account
                </Button>
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="md:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Flights</CardTitle>
                <Plane className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{profileStats.flights}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Chat Sessions</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{profileStats.chats}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saved Cards</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{profileStats.cards}</div>
              </CardContent>
            </Card>
          </div>

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

          {renderTabContent()}
        </div>
      </div>

      {/* Card Dialog */}
      <Dialog open={isCardDialogOpen} onOpenChange={setIsCardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCardId ? "Edit Card" : "Add New Card"}</DialogTitle>
            <DialogDescription>
              {editingCardId
                ? "Update your card details below"
                : "Enter your card details below"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editingCardId ? handleEditCard : handleAddCard}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  name="cardNumber"
                  value={cardFormData.cardNumber}
                  onChange={handleCardInputChange}
                  placeholder="1234 5678 9012 3456"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  name="expiryDate"
                  value={cardFormData.expiryDate}
                  onChange={handleCardInputChange}
                  placeholder="MM/YY"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cardType">Card Type</Label>
                <Select
                  value={cardFormData.cardType}
                  onValueChange={handleCardTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select card type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Visa">Visa</SelectItem>
                    <SelectItem value="Mastercard">Mastercard</SelectItem>
                    <SelectItem value="American Express">American Express</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCardDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingCardId ? "Updating..." : "Adding..."}
                  </>
                ) : (
                  editingCardId ? "Update Card" : "Add Card"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              {deleteItemType === "card" && "Are you sure you want to delete this card? This action cannot be undone."}
              {deleteItemType === "chat" && "Are you sure you want to delete this chat? This action cannot be undone."}
              {deleteItemType === "account" && "Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteItemType === "card") {
                  handleDeleteCard()
                } else if (deleteItemType === "chat") {
                  handleDeleteChat()
                } else if (deleteItemType === "account") {
                  handleDeleteAccount()
                }
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

