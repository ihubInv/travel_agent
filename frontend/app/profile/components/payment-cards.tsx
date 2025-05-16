"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/components/auth-provider";
import { CreditCard, Plus, Trash2 } from "lucide-react";

interface PaymentCard {
  id: string;
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cardType: "visa" | "mastercard" | "amex";
  isDefault: boolean;
}

export function PaymentCards() {
  const { toast } = useToast();
  const { getCards, addCard, deleteCard, setDefaultCard } = useAuth();
  const [cards, setCards] = useState<PaymentCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCard, setNewCard] = useState({
    cardNumber: "",
    cardHolder: "",
    expiryDate: "",
    cvv: ""
  });

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      setIsLoading(true);
      const response = await getCards();
      if (response.success) {
        setCards(response.data);
      } else {
        toast({
          title: "Error",
          description: "Failed to load payment cards",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while loading payment cards",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsAddingCard(true);
      const response = await addCard(newCard);
      if (response.success) {
        toast({
          title: "Success",
          description: "Payment card added successfully"
        });
        setNewCard({
          cardNumber: "",
          cardHolder: "",
          expiryDate: "",
          cvv: ""
        });
        loadCards();
      } else {
        toast({
          title: "Error",
          description: "Failed to add payment card",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while adding payment card",
        variant: "destructive"
      });
    } finally {
      setIsAddingCard(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      const response = await deleteCard(cardId);
      if (response) {
        toast({
          title: "Success",
          description: "Payment card deleted successfully"
        });
        loadCards();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete payment card",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while deleting payment card",
        variant: "destructive"
      });
    }
  };

  const handleSetDefault = async (cardId: string) => {
    try {
      const response = await setDefaultCard(cardId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Default payment card updated successfully"
        });
        loadCards();
      } else {
        toast({
          title: "Error",
          description: "Failed to update default payment card",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while updating default payment card",
        variant: "destructive"
      });
    }
  };

  const getCardType = (cardNumber: string): PaymentCard["cardType"] => {
    if (cardNumber.startsWith("4")) return "visa";
    if (cardNumber.startsWith("5")) return "mastercard";
    if (cardNumber.startsWith("3")) return "amex";
    return "visa";
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Payment Cards</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Card
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Payment Card</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddCard} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    value={newCard.cardNumber}
                    onChange={(e) => setNewCard({ ...newCard, cardNumber: e.target.value })}
                    placeholder="1234 5678 9012 3456"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cardHolder">Card Holder Name</Label>
                  <Input
                    id="cardHolder"
                    value={newCard.cardHolder}
                    onChange={(e) => setNewCard({ ...newCard, cardHolder: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Input
                      id="expiryDate"
                      value={newCard.expiryDate}
                      onChange={(e) => setNewCard({ ...newCard, expiryDate: e.target.value })}
                      placeholder="MM/YY"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      value={newCard.cvv}
                      onChange={(e) => setNewCard({ ...newCard, cvv: e.target.value })}
                      placeholder="123"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isAddingCard}>
                  {isAddingCard ? "Adding..." : "Add Card"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {cards.length === 0 ? (
            <p className="text-muted-foreground">No payment cards found.</p>
          ) : (
            <div className="space-y-4">
              {cards.map((card) => (
                <Card key={card.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <CreditCard className="h-8 w-8" />
                        <div>
                          <p className="font-medium">**** **** **** {card.cardNumber.slice(-4)}</p>
                          <p className="text-sm text-muted-foreground">{card.cardHolder}</p>
                          <p className="text-sm text-muted-foreground">Expires: {card.expiryDate}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!card.isDefault && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefault(card.id)}
                          >
                            Set as Default
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCard(card.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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