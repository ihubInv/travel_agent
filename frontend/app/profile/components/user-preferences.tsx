"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/components/auth-provider";
import { Switch } from "@/components/ui/switch";

interface Passenger {
  id: string;
  name: string;
  passportNumber: string;
  nationality: string;
  dateOfBirth: string;
}

interface FlightPreferences {
  pricePreference: string;
  stopPreference: string;
  departureTimePreference: string;
  mealPreference: string;
  classPreference: string;
  airlinePreference: string;
  flightTypePreference: string;
  automatedBooking: boolean;
}

interface UserPreferences {
  flightPreferences: FlightPreferences;
  passengers: Passenger[];
}

export function UserPreferences() {
  const { toast } = useToast();
  const { getPreferences, updatePreferences, addPassenger, updatePassenger, deletePassenger } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>({
    flightPreferences: {
      pricePreference: "balanced",
      stopPreference: "any",
      departureTimePreference: "any",
      mealPreference: "any",
      classPreference: "any",
      airlinePreference: "any",
      flightTypePreference: "any",
      automatedBooking: false
    },
    passengers: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingPassenger, setIsAddingPassenger] = useState(false);
  const [isEditingPassenger, setIsEditingPassenger] = useState(false);
  const [currentPassenger, setCurrentPassenger] = useState<Passenger | null>(null);
  const [newPassenger, setNewPassenger] = useState<Omit<Passenger, "id">>({
    name: "",
    passportNumber: "",
    nationality: "",
    dateOfBirth: ""
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      const response = await getPreferences();
      if (response.success && response.data) {
        setPreferences(response.data);
      } else {
        toast({
          title: "Error",
          description: "Failed to load preferences",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while loading preferences",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setIsSaving(true);
      const response = await updatePreferences(preferences);
      if (response.success) {
        toast({
          title: "Success",
          description: "Preferences saved successfully"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save preferences",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while saving preferences",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPassenger = async () => {
    try {
      setIsAddingPassenger(true);
      const response = await addPassenger(newPassenger);
      if (response.success && response.data) {
        const newPassengerData: Passenger = response.data;
        setPreferences(prev => ({
          ...prev,
          passengers: [...prev.passengers, newPassengerData]
        }));
        setNewPassenger({
          name: "",
          passportNumber: "",
          nationality: "",
          dateOfBirth: ""
        });
        toast({
          title: "Success",
          description: "Passenger added successfully"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add passenger",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while adding passenger",
        variant: "destructive"
      });
    } finally {
      setIsAddingPassenger(false);
    }
  };

  const handleEditPassenger = async () => {
    if (!currentPassenger) return;

    try {
      setIsEditingPassenger(true);
      const response = await updatePassenger(currentPassenger.id, currentPassenger);
      if (response.success && response.data) {
        const updatedPassengerData: Passenger = response.data;
        setPreferences(prev => ({
          ...prev,
          passengers: prev.passengers.map(p => 
            p.id === currentPassenger.id ? updatedPassengerData : p
          )
        }));
        setCurrentPassenger(null);
        toast({
          title: "Success",
          description: "Passenger updated successfully"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update passenger",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while updating passenger",
        variant: "destructive"
      });
    } finally {
      setIsEditingPassenger(false);
    }
  };

  const handleDeletePassenger = async (passengerId: string) => {
    try {
      const response = await deletePassenger(passengerId);
      if (response.success) {
        setPreferences(prev => ({
          ...prev,
          passengers: prev.passengers.filter(p => p.id !== passengerId)
        }));
        toast({
          title: "Success",
          description: "Passenger deleted successfully"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete passenger",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while deleting passenger",
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
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Flight Preferences</CardTitle>
            <div className="p-2"></div>
            <CardDescription>Customize your flight search preferences</CardDescription>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="relative inline-block w-14 h-7">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={preferences.flightPreferences.automatedBooking}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    flightPreferences: { ...prev.flightPreferences, automatedBooking: e.target.checked }
                  }))}
                />
                <div className="w-14 h-7 bg-gray-200 rounded-full peer peer-checked:bg-blue-500 peer-checked:after:translate-x-7 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all after:duration-300 after:ease-in-out shadow-sm"></div>
              </div>
              <div className="flex flex-col">
                <Label className="text-sm font-medium">Auto Booking</Label>
                <p className="text-xs text-muted-foreground">Automate flight booking process</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Price Preference</Label>
              <Select
                value={preferences.flightPreferences.pricePreference}
                onValueChange={(value) => setPreferences(prev => ({
                  ...prev,
                  flightPreferences: { ...prev.flightPreferences, pricePreference: value }
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lowest">Lowest Price</SelectItem>
                  <SelectItem value="balanced">Balanced</SelectItem>
                  <SelectItem value="highest">Highest Quality</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Stop Preference</Label>
              <Select
                value={preferences.flightPreferences.stopPreference}
                onValueChange={(value) => setPreferences(prev => ({
                  ...prev,
                  flightPreferences: { ...prev.flightPreferences, stopPreference: value }
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="nonstop">Non-stop</SelectItem>
                  <SelectItem value="1stop">1 Stop</SelectItem>
                  <SelectItem value="2stops">2 Stops</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Departure Time Preference</Label>
              <Select
                value={preferences.flightPreferences.departureTimePreference}
                onValueChange={(value) => setPreferences(prev => ({
                  ...prev,
                  flightPreferences: { ...prev.flightPreferences, departureTimePreference: value }
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="afternoon">Afternoon</SelectItem>
                  <SelectItem value="evening">Evening</SelectItem>
                  <SelectItem value="night">Night</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Meal Preference</Label>
              <Select
                value={preferences.flightPreferences.mealPreference}
                onValueChange={(value) => setPreferences(prev => ({
                  ...prev,
                  flightPreferences: { ...prev.flightPreferences, mealPreference: value }
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="vegetarian">Vegetarian</SelectItem>
                  <SelectItem value="vegan">Vegan</SelectItem>
                  <SelectItem value="halal">Halal</SelectItem>
                  <SelectItem value="kosher">Kosher</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Class Preference</Label>
              <Select
                value={preferences.flightPreferences.classPreference}
                onValueChange={(value) => setPreferences(prev => ({
                  ...prev,
                  flightPreferences: { ...prev.flightPreferences, classPreference: value }
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="economy">Economy</SelectItem>
                  <SelectItem value="premium">Premium Economy</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="first">First Class</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Airline Preference</Label>
              <Select
                value={preferences.flightPreferences.airlinePreference}
                onValueChange={(value) => setPreferences(prev => ({
                  ...prev,
                  flightPreferences: { ...prev.flightPreferences, airlinePreference: value }
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="emirates">Emirates</SelectItem>
                  <SelectItem value="qatar">Qatar Airways</SelectItem>
                  <SelectItem value="singapore">Singapore Airlines</SelectItem>
                  <SelectItem value="cathay">Cathay Pacific</SelectItem>
                  <SelectItem value="lufthansa">Lufthansa</SelectItem>
                  <SelectItem value="british">British Airways</SelectItem>
                  <SelectItem value="american">American Airlines</SelectItem>
                  <SelectItem value="delta">Delta</SelectItem>
                  <SelectItem value="united">United</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Flight Type Preference</Label>
              <Select
                value={preferences.flightPreferences.flightTypePreference}
                onValueChange={(value) => setPreferences(prev => ({
                  ...prev,
                  flightPreferences: { ...prev.flightPreferences, flightTypePreference: value }
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="domestic">Domestic</SelectItem>
                  <SelectItem value="international">International</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* <Button onClick={handleSavePreferences} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Flight Preferences"}
          </Button> */}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saved Passengers</CardTitle>
        </CardHeader>
        <CardContent>
          <Dialog>
            <DialogTrigger asChild>
              <Button onClick={() => setNewPassenger({
                name: "",
                passportNumber: "",
                nationality: "",
                dateOfBirth: ""
              })}>Add Passenger</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Passenger</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={newPassenger.name}
                    onChange={(e) => setNewPassenger(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Passport Number</Label>
                  <Input
                    value={newPassenger.passportNumber}
                    onChange={(e) => setNewPassenger(prev => ({ ...prev, passportNumber: e.target.value }))}
                    placeholder="Enter passport number"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nationality</Label>
                  <Input
                    value={newPassenger.nationality}
                    onChange={(e) => setNewPassenger(prev => ({ ...prev, nationality: e.target.value }))}
                    placeholder="Enter nationality"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={newPassenger.dateOfBirth}
                    onChange={(e) => setNewPassenger(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  />
                </div>
                <Button onClick={handleAddPassenger} disabled={isAddingPassenger}>
                  {isAddingPassenger ? "Adding..." : "Add Passenger"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {preferences.passengers.length === 0 ? (
            <p className="text-muted-foreground mt-4">No passengers added yet.</p>
          ) : (
            <div className="space-y-4 mt-4">
              {preferences.passengers.map((passenger) => (
                <Card key={passenger.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="font-medium">{passenger.name}</p>
                        <p className="text-sm text-muted-foreground">Passport: {passenger.passportNumber}</p>
                        <p className="text-sm text-muted-foreground">Nationality: {passenger.nationality}</p>
                        <p className="text-sm text-muted-foreground">Date of Birth: {passenger.dateOfBirth}</p>
                      </div>
                      <div className="space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              onClick={() => setCurrentPassenger(passenger)}
                            >
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Passenger</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label>Full Name</Label>
                                <Input
                                  value={currentPassenger?.name || ""}
                                  onChange={(e) => setCurrentPassenger(prev => prev ? { ...prev, name: e.target.value } : null)}
                                  placeholder="Enter full name"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Passport Number</Label>
                                <Input
                                  value={currentPassenger?.passportNumber || ""}
                                  onChange={(e) => setCurrentPassenger(prev => prev ? { ...prev, passportNumber: e.target.value } : null)}
                                  placeholder="Enter passport number"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Nationality</Label>
                                <Input
                                  value={currentPassenger?.nationality || ""}
                                  onChange={(e) => setCurrentPassenger(prev => prev ? { ...prev, nationality: e.target.value } : null)}
                                  placeholder="Enter nationality"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Date of Birth</Label>
                                <Input
                                  type="date"
                                  value={currentPassenger?.dateOfBirth || ""}
                                  onChange={(e) => setCurrentPassenger(prev => prev ? { ...prev, dateOfBirth: e.target.value } : null)}
                                />
                              </div>
                              <Button onClick={handleEditPassenger} disabled={isEditingPassenger}>
                                {isEditingPassenger ? "Saving..." : "Save Changes"}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive">Delete</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the passenger.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeletePassenger(passenger.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          onClick={handleSavePreferences} 
          disabled={isSaving}
          className="w-full md:w-auto"
        >
          {isSaving ? "Saving..." : "Save Flight Preferences"}
        </Button>
      </div>
    </div>
  );
} 