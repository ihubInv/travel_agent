"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, CreditCard, Edit, Loader2, Plus, Trash2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type CardDetail = {
  id: string
  cardNumber: string
  expiryDate: string
  cardType: string
  created_at?: string
}

export default function CardsPage() {
  const { getCards, addCard, updateCard, deleteCard } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [cards, setCards] = useState<CardDetail[]>([])
  
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
  const [deleteCardId, setDeleteCardId] = useState<string | null>(null)

  useEffect(() => {
    fetchCards()
  }, [])

  const fetchCards = async () => {
    try {
      const cardsData = await getCards()
      setCards(cardsData || [])
    } catch (err) {
      setError("Failed to load cards")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCardInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCardFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCardTypeChange = (value: string) => {
    setCardFormData(prev => ({ ...prev, cardType: value }))
  }

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await addCard(cardFormData)
      setSuccess("Card added successfully")
      setIsCardDialogOpen(false)
      setCardFormData({
        cardNumber: "",
        expiryDate: "",
        cardType: "Visa"
      })
      fetchCards()
    } catch (err) {
      setError("Failed to add card")
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
      await updateCard(editingCardId, cardFormData)
      setSuccess("Card updated successfully")
      setIsCardDialogOpen(false)
      setEditingCardId(null)
      setCardFormData({
        cardNumber: "",
        expiryDate: "",
        cardType: "Visa"
      })
      fetchCards()
    } catch (err) {
      setError("Failed to update card")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteCard = async () => {
    if (!deleteCardId) return

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await deleteCard(deleteCardId)
      setSuccess("Card deleted successfully")
      setIsDeleteDialogOpen(false)
      setDeleteCardId(null)
      fetchCards()
    } catch (err) {
      setError("Failed to delete card")
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
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Payment Cards</CardTitle>
            <CardDescription>Manage your saved payment methods</CardDescription>
          </div>
          <Dialog open={isCardDialogOpen} onOpenChange={setIsCardDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Card
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCardId ? "Edit Card" : "Add New Card"}</DialogTitle>
                <DialogDescription>
                  {editingCardId 
                    ? "Update your card details below." 
                    : "Enter your card details below to save for future payments."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={editingCardId ? handleEditCard : handleAddCard}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      name="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={cardFormData.cardNumber}
                      onChange={handleCardInputChange}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiryDate">Expiry Date</Label>
                      <Input
                        id="expiryDate"
                        name="expiryDate"
                        placeholder="MM/YY"
                        value={cardFormData.expiryDate}
                        onChange={handleCardInputChange}
                        required
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
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCardDialogOpen(false)
                      setEditingCardId(null)
                      setCardFormData({
                        cardNumber: "",
                        expiryDate: "",
                        cardType: "Visa"
                      })
                    }}
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
                      editingCardId ? "Update Card" : "Add Card"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
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
              {cards.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No cards saved
                </div>
              ) : (
                cards.map((card) => (
                  <Card key={card.id} className="hover:bg-accent/50 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="bg-primary/10 p-3 rounded-full">
                            <CreditCard className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{card.cardType}</div>
                            <div className="text-sm text-muted-foreground">
                              •••• {card.cardNumber.slice(-4)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="text-sm text-muted-foreground">
                            Expires {card.expiryDate}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditCardDialog(card)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDeleteCardId(card.id)
                              setIsDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
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
            <DialogTitle>Delete Card</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this card? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setDeleteCardId(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCard}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Card"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 