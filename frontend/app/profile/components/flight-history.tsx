"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/components/auth-provider";
import { format } from "date-fns";

interface Flight {
  id: string;
  flightNumber: string;
  airline: string;
  departureAirport: string;
  arrivalAirport: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  status: "scheduled" | "completed" | "cancelled";
  class: "economy" | "premium" | "business" | "first";
}

export function FlightHistory() {
  const { toast } = useToast();
  const { getFlights } = useAuth();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFlights();
  }, []);

  const loadFlights = async () => {
    try {
      setIsLoading(true);
      const response = await getFlights();
      if (response.success) {
        setFlights(response.data);
      } else {
        toast({
          title: "Error",
          description: "Failed to load flight history",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while loading flight history",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: Flight["status"]) => {
    switch (status) {
      case "scheduled":
        return "text-blue-500";
      case "completed":
        return "text-green-500";
      case "cancelled":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getClassColor = (classType: Flight["class"]) => {
    switch (classType) {
      case "economy":
        return "text-gray-500";
      case "premium":
        return "text-blue-500";
      case "business":
        return "text-purple-500";
      case "first":
        return "text-yellow-500";
      default:
        return "text-gray-500";
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Flight History</CardTitle>
        </CardHeader>
        <CardContent>
          {flights.length === 0 ? (
            <p className="text-muted-foreground">No flights found.</p>
          ) : (
            <div className="space-y-4">
              {flights.map((flight) => (
                <Card key={flight.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="font-medium">{flight.airline} - {flight.flightNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(flight.departureTime), "MMM d, yyyy h:mm a")} - {format(new Date(flight.arrivalTime), "MMM d, yyyy h:mm a")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${flight.price.toFixed(2)}</p>
                          <p className={`text-sm ${getStatusColor(flight.status)}`}>
                            {flight.status.charAt(0).toUpperCase() + flight.status.slice(1)}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="space-y-1">
                          <p className="font-medium">{flight.departureAirport}</p>
                          <p className="text-sm text-muted-foreground">Departure</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">{flight.duration}</p>
                          <div className="w-24 h-0.5 bg-gray-300 my-2"></div>
                        </div>
                        <div className="space-y-1 text-right">
                          <p className="font-medium">{flight.arrivalAirport}</p>
                          <p className="text-sm text-muted-foreground">Arrival</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className={`text-sm ${getClassColor(flight.class)}`}>
                          {flight.class.charAt(0).toUpperCase() + flight.class.slice(1)} Class
                        </p>
                        <Button variant="outline" size="sm">
                          View Details
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