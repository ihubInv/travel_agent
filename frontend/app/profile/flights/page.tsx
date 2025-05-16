"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2, Plane } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

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

export default function FlightsPage() {
  const { getFlights } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [flights, setFlights] = useState<Flight[]>([])

  useEffect(() => {
    fetchFlights()
  }, [])

  const fetchFlights = async () => {
    try {
      const flightsData = await getFlights()
      setFlights(flightsData || [])
    } catch (err) {
      setError("Failed to load flights")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-green-500"
      case "pending":
        return "bg-yellow-500"
      case "cancelled":
        return "bg-red-500"
      default:
        return "bg-gray-500"
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
          <CardTitle>Flight History</CardTitle>
          <CardDescription>View your past and upcoming flights</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {flights.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No flights found
                </div>
              ) : (
                flights.map((flight) => (
                  <Card key={flight.id} className="hover:bg-accent/50 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center space-x-4">
                          <div className="bg-primary/10 p-3 rounded-full">
                            <Plane className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium text-lg">
                              {flight.from} → {flight.to}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(flight.date).toLocaleDateString()} • {flight.passengers} passengers • {flight.class}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={getStatusColor(flight.status)}>
                            {flight.status}
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            Booked on {new Date(flight.created_at).toLocaleDateString()}
                          </div>
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
    </div>
  )
} 