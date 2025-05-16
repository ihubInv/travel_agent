// "use client"

// import { useState } from "react"
// import Link from "next/link"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { Badge } from "@/components/ui/badge"
// import { Check, Filter, ArrowUpDown } from "lucide-react"
// import { motion } from "framer-motion"

// type FlightOption = {
//   id: string
//   airline: string
//   departureTime: string
//   arrivalTime: string
//   duration: string
//   price: number
//   stops: number
//   logo: string
// }

// export default function PricingPage() {
//   const [selectedTab, setSelectedTab] = useState("economy")
//   const [sortBy, setSortBy] = useState<"price" | "duration" | "departure">("price")
//   const [filterStops, setFilterStops] = useState<number | null>(null)

//   // Sample flight data
//   const flightOptions: FlightOption[] = [
//     {
//       id: "1",
//       airline: "Delta Airlines",
//       departureTime: "08:00 AM",
//       arrivalTime: "11:30 AM",
//       duration: "3h 30m",
//       price: 299,
//       stops: 0,
//       logo: "/placeholder.svg?height=40&width=40",
//     },
//     {
//       id: "2",
//       airline: "United Airlines",
//       departureTime: "10:15 AM",
//       arrivalTime: "02:45 PM",
//       duration: "4h 30m",
//       price: 249,
//       stops: 1,
//       logo: "/placeholder.svg?height=40&width=40",
//     },
//     {
//       id: "3",
//       airline: "American Airlines",
//       departureTime: "12:30 PM",
//       arrivalTime: "03:45 PM",
//       duration: "3h 15m",
//       price: 329,
//       stops: 0,
//       logo: "/placeholder.svg?height=40&width=40",
//     },
//     {
//       id: "4",
//       airline: "JetBlue",
//       departureTime: "02:00 PM",
//       arrivalTime: "06:30 PM",
//       duration: "4h 30m",
//       price: 199,
//       stops: 1,
//       logo: "/placeholder.svg?height=40&width=40",
//     },
//     {
//       id: "5",
//       airline: "Southwest",
//       departureTime: "04:45 PM",
//       arrivalTime: "08:15 PM",
//       duration: "3h 30m",
//       price: 279,
//       stops: 0,
//       logo: "/placeholder.svg?height=40&width=40",
//     },
//   ]

//   // Apply sorting and filtering
//   const sortedAndFilteredFlights = [...flightOptions]
//     .filter((flight) => filterStops === null || flight.stops === filterStops)
//     .sort((a, b) => {
//       if (sortBy === "price") return a.price - b.price
//       if (sortBy === "duration") return a.duration.localeCompare(b.duration)
//       return a.departureTime.localeCompare(b.departureTime)
//     })

//   // Apply price multiplier based on selected class
//   const getPriceWithClass = (price: number) => {
//     switch (selectedTab) {
//       case "business":
//         return price * 2.5
//       case "first":
//         return price * 4
//       default:
//         return price
//     }
//   }

//   return (
//     <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-primary/5 dark:from-background dark:to-primary/10">
//       <div className="container mx-auto">
//         <div className="text-center mb-12">
//           <h1 className="text-4xl font-bold mb-4">Flight Options</h1>
//           <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
//             Browse available flights and find the best option for your journey
//           </p>
//         </div>

//         <div className="mb-8">
//           <Tabs defaultValue="economy" className="w-full" onValueChange={(value) => setSelectedTab(value)}>
//             <div className="flex justify-center mb-6">
//               <TabsList className="grid w-full max-w-md grid-cols-3">
//                 <TabsTrigger value="economy">Economy</TabsTrigger>
//                 <TabsTrigger value="business">Business</TabsTrigger>
//                 <TabsTrigger value="first">First Class</TabsTrigger>
//               </TabsList>
//             </div>

//             <TabsContent value="economy" className="mt-0">
//               <div className="text-center mb-6">
//                 <h2 className="text-2xl font-semibold">Economy Class</h2>
//                 <p className="text-muted-foreground">Affordable comfort for your journey</p>
//               </div>
//             </TabsContent>

//             <TabsContent value="business" className="mt-0">
//               <div className="text-center mb-6">
//                 <h2 className="text-2xl font-semibold">Business Class</h2>
//                 <p className="text-muted-foreground">Enhanced comfort and premium service</p>
//               </div>
//             </TabsContent>

//             <TabsContent value="first" className="mt-0">
//               <div className="text-center mb-6">
//                 <h2 className="text-2xl font-semibold">First Class</h2>
//                 <p className="text-muted-foreground">Ultimate luxury and personalized experience</p>
//               </div>
//             </TabsContent>
//           </Tabs>
//         </div>

//         <div className="flex flex-col md:flex-row gap-6 mb-8">
//           <Card className="w-full md:w-64">
//             <CardHeader>
//               <CardTitle className="text-lg">Filters</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div>
//                 <h3 className="font-medium mb-2 flex items-center">
//                   <Filter className="h-4 w-4 mr-2" />
//                   Stops
//                 </h3>
//                 <div className="space-y-2">
//                   <Button
//                     variant={filterStops === null ? "default" : "outline"}
//                     size="sm"
//                     className="w-full justify-start"
//                     onClick={() => setFilterStops(null)}
//                   >
//                     All
//                   </Button>
//                   <Button
//                     variant={filterStops === 0 ? "default" : "outline"}
//                     size="sm"
//                     className="w-full justify-start"
//                     onClick={() => setFilterStops(0)}
//                   >
//                     Non-stop
//                   </Button>
//                   <Button
//                     variant={filterStops === 1 ? "default" : "outline"}
//                     size="sm"
//                     className="w-full justify-start"
//                     onClick={() => setFilterStops(1)}
//                   >
//                     1 Stop
//                   </Button>
//                 </div>
//               </div>

//               <div>
//                 <h3 className="font-medium mb-2 flex items-center">
//                   <ArrowUpDown className="h-4 w-4 mr-2" />
//                   Sort by
//                 </h3>
//                 <div className="space-y-2">
//                   <Button
//                     variant={sortBy === "price" ? "default" : "outline"}
//                     size="sm"
//                     className="w-full justify-start"
//                     onClick={() => setSortBy("price")}
//                   >
//                     Price
//                   </Button>
//                   <Button
//                     variant={sortBy === "duration" ? "default" : "outline"}
//                     size="sm"
//                     className="w-full justify-start"
//                     onClick={() => setSortBy("duration")}
//                   >
//                     Duration
//                   </Button>
//                   <Button
//                     variant={sortBy === "departure" ? "default" : "outline"}
//                     size="sm"
//                     className="w-full justify-start"
//                     onClick={() => setSortBy("departure")}
//                   >
//                     Departure Time
//                   </Button>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           <div className="flex-1 space-y-4">
//             {sortedAndFilteredFlights.map((flight, index) => (
//               <motion.div
//                 key={flight.id}
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ duration: 0.3, delay: index * 0.1 }}
//               >
//                 <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 relative">
//                   <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
//                   <CardContent className="p-0">
//                     <div className="p-6">
//                       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
//                         <div className="flex items-center gap-4">
//                           <img
//                             src={flight.logo || "/placeholder.svg"}
//                             alt={flight.airline}
//                             className="h-10 w-10 rounded-full"
//                           />
//                           <div>
//                             <h3 className="font-semibold">{flight.airline}</h3>
//                             {flight.stops === 0 ? (
//                               <Badge
//                                 variant="outline"
//                                 className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
//                               >
//                                 Non-stop
//                               </Badge>
//                             ) : (
//                               <Badge
//                                 variant="outline"
//                                 className="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
//                               >
//                                 {flight.stops} Stop
//                               </Badge>
//                             )}
//                           </div>
//                         </div>

//                         <div className="flex items-center gap-4">
//                           <div className="text-center">
//                             <div className="font-semibold">{flight.departureTime}</div>
//                             <div className="text-sm text-muted-foreground">Departure</div>
//                           </div>

//                           <div className="flex flex-col items-center">
//                             <div className="text-xs text-muted-foreground">{flight.duration}</div>
//                             <div className="relative w-20 h-px bg-border my-1">
//                               <div className="absolute top-1/2 right-0 w-1.5 h-1.5 rounded-full bg-primary transform -translate-y-1/2"></div>
//                               <div className="absolute top-1/2 left-0 w-1.5 h-1.5 rounded-full bg-primary transform -translate-y-1/2"></div>
//                             </div>
//                           </div>

//                           <div className="text-center">
//                             <div className="font-semibold">{flight.arrivalTime}</div>
//                             <div className="text-sm text-muted-foreground">Arrival</div>
//                           </div>
//                         </div>

//                         <div className="text-right">
//                           <div className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
//                             ${getPriceWithClass(flight.price).toFixed(0)}
//                           </div>
//                           <div className="text-sm text-muted-foreground">{selectedTab} class</div>
//                         </div>
//                       </div>
//                     </div>

//                     <div className="bg-muted/50 p-4 flex justify-between items-center">
//                       <div className="flex items-center gap-2">
//                         <Check className="h-4 w-4 text-green-500" />
//                         <span className="text-sm">Free cancellation within 24 hours</span>
//                       </div>
//                       <Button
//                         asChild
//                         className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all duration-300"
//                       >
//                         <Link href="/chat">Select</Link>
//                       </Button>
//                     </div>
//                   </CardContent>
//                 </Card>
//               </motion.div>
//             ))}

//             {sortedAndFilteredFlights.length === 0 && (
//               <Card className="p-8 text-center">
//                 <CardContent>
//                   <p className="text-muted-foreground">No flights match your current filters.</p>
//                   <Button
//                     variant="link"
//                     onClick={() => {
//                       setFilterStops(null)
//                       setSortBy("price")
//                     }}
//                   >
//                     Clear filters
//                   </Button>
//                 </CardContent>
//               </Card>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }





import React from "react";

const flights = [
  {
    airline: "Akasa Air",
    logo: "https://storage.googleapis.com/a1aa/image/15ad8ac3-9dd9-4c73-cfb1-ad578d779d97.jpg",
    time: "08:30 – 10:55",
    route: "DEL - BOM · 2h 25m · Direct",
    price: "₹ 5,036",
    tags: ["Best", "Cheapest"],
  },
  {
    airline: "Akasa Air",
    logo: "https://storage.googleapis.com/a1aa/image/15ad8ac3-9dd9-4c73-cfb1-ad578d779d97.jpg",
    time: "10:00 – 12:25",
    route: "DEL - BOM · 2h 25m · Direct",
    price: "₹ 5,043",
    tags: [],
  },
  {
    airline: "Akasa Air",
    logo: "https://storage.googleapis.com/a1aa/image/15ad8ac3-9dd9-4c73-cfb1-ad578d779d97.jpg",
    time: "10:00 – 12:25",
    route: "DEL - BOM · 2h 25m · Direct",
    price: "₹ 5,043",
    tags: [],
  },
  {
    airline: "Akasa Air",
    logo: "https://storage.googleapis.com/a1aa/image/15ad8ac3-9dd9-4c73-cfb1-ad578d779d97.jpg",
    time: "10:00 – 12:25",
    route: "DEL - BOM · 2h 25m · Direct",
    price: "₹ 5,043",
    tags: [],
  },
  {
    airline: "Akasa Air",
    logo: "https://storage.googleapis.com/a1aa/image/15ad8ac3-9dd9-4c73-cfb1-ad578d779d97.jpg",
    time: "10:00 – 12:25",
    route: "DEL - BOM · 2h 25m · Direct",
    price: "₹ 5,043",
    tags: [],
  },
  {
    airline: "Akasa Air",
    logo: "https://storage.googleapis.com/a1aa/image/15ad8ac3-9dd9-4c73-cfb1-ad578d779d97.jpg",
    time: "10:00 – 12:25",
    route: "DEL - BOM · 2h 25m · Direct",
    price: "₹ 5,043",
    tags: [],
  },
  {
    airline: "Akasa Air",
    logo: "https://storage.googleapis.com/a1aa/image/15ad8ac3-9dd9-4c73-cfb1-ad578d779d97.jpg",
    time: "10:00 – 12:25",
    route: "DEL - BOM · 2h 25m · Direct",
    price: "₹ 5,043",
    tags: [],
  },  {
    airline: "Akasa Air",
    logo: "https://storage.googleapis.com/a1aa/image/15ad8ac3-9dd9-4c73-cfb1-ad578d779d97.jpg",
    time: "10:00 – 12:25",
    route: "DEL - BOM · 2h 25m · Direct",
    price: "₹ 5,043",
    tags: [],
  },
  {
    airline: "Akasa Air",
    logo: "https://storage.googleapis.com/a1aa/image/15ad8ac3-9dd9-4c73-cfb1-ad578d779d97.jpg",
    time: "10:00 – 12:25",
    route: "DEL - BOM · 2h 25m · Direct",
    price: "₹ 5,043",
    tags: [],
  },
  {
    airline: "Akasa Air",
    logo: "https://storage.googleapis.com/a1aa/image/15ad8ac3-9dd9-4c73-cfb1-ad578d779d97.jpg",
    time: "10:00 – 12:25",
    route: "DEL - BOM · 2h 25m · Direct",
    price: "₹ 5,043",
    tags: [],
  },
];

export default function PricingPage() {
  return (
    <main className="bg-[#121916] text-[#e1e3e3] min-h-screen flex justify-center p-4 font-['Inter']">
  <section className="max-w-5xl w-full">
    <div className="flex items-center gap-2 mb-3">
      <i className="fas fa-plane-departure text-[#e1e3e3] text-base" />
      <h1 className="font-semibold text-white text-base leading-5">Flight results</h1>
    </div>

    <div className="bg-[#1f292b] rounded-xl p-5 overflow-x-auto">
      <h2 className="font-semibold text-white text-lg leading-6 mb-1">
        Flights DEL <span className="text-[#9ca3af]">→</span> BOM
      </h2>
      <p className="text-[#9ca3af] text-sm leading-5 mb-1">
        New Delhi, India <span className="text-[#9ca3af]">→</span> Mumbai, India
      </p>
      <p className="text-[#6b7280] text-xs leading-4 mb-1">
        One-way · 20 Jun · 1 adult · Economy
      </p>
      <p className="text-[#9ca3af] text-xs leading-4 mb-4">3 of 336 matching flights</p>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[#2a3a3c] text-sm text-white">
            <th className="py-3 font-semibold">Airline</th>
            <th className="py-3 font-semibold">Time</th>
            <th className="py-3 font-semibold">Route</th>
            <th className="py-3 font-semibold">Tags</th>
            <th className="py-3 font-semibold text-right">Price</th>
            <th className="py-3"></th>
          </tr>
        </thead>
        <tbody>
          {flights.map((flight, index) => (
            <tr key={index} className="border-b border-[#2a3a3c]">
              <td className="flex items-center gap-3 py-3">
                <img
                  src={flight.logo}
                  alt={`${flight.airline} logo`}
                  className="w-6 h-6 flex-shrink-0"
                />
                <span className="text-[#e1e3e3] text-sm font-normal">{flight.airline}</span>
              </td>
              <td className="py-3 font-semibold text-sm text-white">{flight.time}</td>
              <td className="py-3 text-[#9ca3af] text-xs">{flight.route}</td>
              <td className="py-3 flex gap-2 flex-wrap">
                {flight.tags.includes("Best") && (
                  <span className="bg-[#00405e] text-xs font-semibold rounded px-2 py-0.5">Best</span>
                )}
                {flight.tags.includes("Cheapest") && (
                  <span className="bg-[#0f7f3e] text-xs font-semibold rounded px-2 py-0.5">Cheapest</span>
                )}
              </td>
              <td className="py-3 text-right">
                <p className="text-white font-semibold text-lg">{flight.price}</p>
                <p className="text-[#9ca3af] text-xs">Economy</p>
              </td>
              <td className="py-3 pl-2 text-right">
                <button
                  aria-label="Add to favorites"
                  className="text-[#9ca3af] hover:text-white transition-colors"
                >
                  <i className="far fa-heart text-lg" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
</main>

  );
};


