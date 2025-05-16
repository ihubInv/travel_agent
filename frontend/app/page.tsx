"use client"

import FlyingAirplane from "@/components/flying-airplane"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"
import { ArrowRight, Clock, CreditCard, Plane, Users } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <>
    <div className="min-h-screen relative overflow-hidden z-0">
  {/* Flying Airplane Animation */}
  <div className="pointer-events-none z-0">
    <FlyingAirplane />
  </div>

  {/* Hero Section */}
  <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/10 dark:from-primary/30 dark:via-secondary/30 dark:to-primary/20">
    <div className="container mx-auto">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
        <div className="max-w-2xl z-10">
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <img 
              src="/title-image.svg" 
              alt="Flight Agent Logo" 
              className="h-16 w-auto mb-4"
            />
          </motion.div>
          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Book Flights Smarter with{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">AI</span>
          </motion.h1>
          <motion.p
            className="text-xl text-muted-foreground mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Our AI agent helps you find and book the perfect flights, saving you time and money with personalized recommendations.
          </motion.p>
          <motion.div
            className="flex flex-wrap gap-4 z-10 relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Button
              size="lg"
              asChild
              className="group bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all duration-300"
            >
              <Link href="/login">
                Book a Flight
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/about">Learn More</Link>
            </Button>
          </motion.div>
        </div>

        <motion.div
          className="relative w-full max-w-md z-10"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-primary via-secondary to-primary blur-lg opacity-30 animate-pulse pointer-events-none"></div>
          <Card className="relative border-2 shadow-xl">
            <CardHeader>
              <CardTitle>AI Flight Assistant</CardTitle>
              <CardDescription>Ready to help you find your next journey</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Plane className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">AI Assistant</p>
                  <p className="text-sm text-muted-foreground">Hello! Where would you like to fly today?</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/10">
                <div className="h-8 w-8 rounded-full bg-secondary/20 flex items-center justify-center">
                  <Users className="h-4 w-4 text-secondary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">You</p>
                  <p className="text-sm">I need a flight from New York to London next week.</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all duration-300"
                asChild
              >
                <Link href="/login">Start Chatting</Link>
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
      
      {/* Hero Image */}
      <motion.div 
        className="mt-16 flex justify-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4 }}
      >
        {/* <img 
          src="/hero-image.svg" 
          alt="AI Flight Agent" 
          className="w-full max-w-3xl h-auto rounded-lg shadow-xl"
        /> */}
      </motion.div>
    </div>
  </section>

  {/* Features Section */}
  <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
    <div className="container mx-auto">
      <div className="text-center mb-16">
        <motion.h2
          className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Why Choose Our AI Flight Agent?
        </motion.h2>
        <motion.p
          className="text-xl text-muted-foreground max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Experience a new way to book flights with our intelligent assistant that understands your preferences.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
          >
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-2 overflow-hidden relative z-10">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center mb-4 group-hover:from-primary/30 group-hover:to-secondary/30 transition-colors">
                  {feature.icon}
                </div>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  </section>

  {/* CTA Section */}
  <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-muted/50 via-primary/5 to-muted/50 dark:from-muted/20 dark:via-primary/10 dark:to-muted/20 relative z-10">
    <div className="container mx-auto text-center">
      <motion.h2
        className="text-3xl font-bold mb-6"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
      >
        Ready to Book Your Next Flight?
      </motion.h2>
      <motion.p
        className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        viewport={{ once: true }}
      >
        Join thousands of travelers who are saving time and money with our AI flight booking assistant.
      </motion.p>
      <motion.div
        className="flex flex-wrap justify-center gap-4"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        viewport={{ once: true }}
      >
        <Button
          size="lg"
          asChild
          className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all duration-300"
        >
          <Link href="/login?tab=register">Get Started</Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/pricing">View Pricing</Link>
        </Button>
      </motion.div>
    </div>
  </section>
</div>

 </> )
}

const features = [
  {
    title: "Smart Flight Recommendations",
    description: "Our AI analyzes thousands of flights to find the best options based on your preferences and budget.",
    icon: <Plane className="h-6 w-6 text-primary" />,
  },
  {
    title: "Real-time Price Alerts",
    description: "Get notified when prices drop for flights you're interested in, so you never miss a deal.",
    icon: <CreditCard className="h-6 w-6 text-primary" />,
  },
  {
    title: "24/7 Booking Assistance",
    description: "Our AI assistant is available around the clock to help you book flights and answer questions.",
    icon: <Clock className="h-6 w-6 text-primary" />,
  },
]

