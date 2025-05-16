"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plane, MessageSquare, Clock } from "lucide-react"
import Image from "next/image"
import { Suspense } from "react"
import { motion } from "framer-motion"

// Define the data first
const steps = [
  {
    title: "Tell Us Your Travel Plans",
    description:
      "Chat with our AI assistant about your travel needs, preferences, and budget in a natural conversation.",
  },
  {
    title: "Review Personalized Options",
    description:
      "Our AI instantly analyzes thousands of flights to present you with the best options tailored to your needs.",
  },
  {
    title: "Book with Confidence",
    description: "Select your preferred flight and complete your booking securely through our platform.",
  },
]

const team = [
  {
    name: "Alex Johnson",
    role: "CEO & Founder",
    bio: "Travel enthusiast with 15+ years in the travel industry and a passion for AI technology.",
    image: "/placeholder-avatar.jpg",
  },
  {
    name: "Sarah Chen",
    role: "CTO",
    bio: "AI expert with a background in machine learning and natural language processing.",
    image: "/placeholder-avatar.jpg",
  },
  {
    name: "Michael Rodriguez",
    role: "Head of Product",
    bio: "Former travel agent who understands the pain points of traditional flight booking.",
    image: "/placeholder-avatar.jpg",
  },
  {
    name: "Priya Patel",
    role: "Customer Experience",
    bio: "Dedicated to ensuring our users have the best possible experience with our platform.",
    image: "/placeholder-avatar.jpg",
  },
]

const testimonials = [
  {
    name: "David Wilson",
    location: "New York, USA",
    quote: "The AI assistant found me a flight that was $200 cheaper than what I found on my own. Amazing service!",
    avatar: "/placeholder-avatar.jpg",
  },
  {
    name: "Emma Thompson",
    location: "London, UK",
    quote: "I love how easy it is to book flights now. Just a quick chat and I'm all set for my trip.",
    avatar: "/placeholder-avatar.jpg",
  },
  {
    name: "Jamal Ahmed",
    location: "Dubai, UAE",
    quote: "The personalized recommendations are spot on. It's like having a travel agent who really knows me.",
    avatar: "/placeholder-avatar.jpg",
  },
]

// Create a client component for animations
const AnimatedSection = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay }}
    >
      {children}
    </motion.div>
  )
}

interface Step {
  title: string;
  description: string;
}

interface TeamMember {
  name: string;
  role: string;
  bio: string;
  image: string;
}

interface Testimonial {
  name: string;
  location: string;
  quote: string;
  avatar: string;
}

// Create client components for each section that needs animation
const AnimatedSteps = ({ steps }: { steps: Step[] }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {steps.map((step: Step, index: number) => (
        <AnimatedSection key={index} delay={index * 0.1}>
          <div className="relative">
            <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-primary/20 to-primary/10 blur-lg opacity-25"></div>
            <Card className="relative h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/20 text-primary mb-4">
                  <span className="text-lg font-bold">{index + 1}</span>
                </div>
                <CardTitle>{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          </div>
        </AnimatedSection>
      ))}
    </div>
  )
}

const AnimatedTeam = ({ team }: { team: TeamMember[] }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      {team.map((member: TeamMember, index: number) => (
        <AnimatedSection key={member.name} delay={index * 0.1}>
          <Card className="group overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="aspect-square overflow-hidden">
              <Image
                src="/placeholder-avatar.svg"
                alt={member.name}
                width={300}
                height={300}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            </div>
            <CardHeader>
              <CardTitle>{member.name}</CardTitle>
              <CardDescription>{member.role}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{member.bio}</p>
            </CardContent>
          </Card>
        </AnimatedSection>
      ))}
    </div>
  )
}

const AnimatedTestimonials = ({ testimonials }: { testimonials: Testimonial[] }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {testimonials.map((testimonial: Testimonial, index: number) => (
        <AnimatedSection key={index} delay={index * 0.1}>
          <Card className="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Avatar>
                  <Image
                    src="/placeholder-avatar.svg"
                    alt={testimonial.name}
                    width={40}
                    height={40}
                    className="rounded-full"
                    loading="lazy"
                  />
                  <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                  <CardDescription>{testimonial.location}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground italic">"{testimonial.quote}"</p>
            </CardContent>
          </Card>
        </AnimatedSection>
      ))}
    </div>
  )
}

// Main page component
export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Company Overview */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/10 dark:from-primary/30 dark:via-secondary/30 dark:to-primary/20">
        <div className="container mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-6">About Our AI Flight Agent</h1>
            <p className="text-xl text-muted-foreground mb-8">
              We're revolutionizing the way people book flights by combining cutting-edge AI technology with a deep
              understanding of travel needs.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
              <p className="text-lg text-muted-foreground mb-6">
                Our mission is to make travel planning effortless and enjoyable. We believe that finding the perfect
                flight shouldn't be a time-consuming or stressful experience.
              </p>
              <p className="text-lg text-muted-foreground">
                By leveraging the power of artificial intelligence, we're able to provide personalized recommendations
                that save you time and money, while ensuring you have the best possible travel experience.
              </p>
            </div>
            <div className="relative">
              <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-primary to-secondary blur-lg opacity-25"></div>
              <div className="relative bg-card rounded-lg p-8 shadow-lg border">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Plane className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Smarter Flight Search</h3>
                      <p className="text-sm text-muted-foreground">Finding the perfect flight in seconds</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Conversational Booking</h3>
                      <p className="text-sm text-muted-foreground">Book flights through natural conversation</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">24/7 Availability</h3>
                      <p className="text-sm text-muted-foreground">Get help whenever you need it</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/50 dark:bg-muted/20">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our AI flight booking process is simple, efficient, and designed with you in mind.
            </p>
          </div>

          <AnimatedSteps steps={steps} />
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Meet Our Team</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The passionate individuals behind our AI flight booking platform.
            </p>
          </div>

          <AnimatedTeam team={team} />
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-muted/50 via-primary/5 to-muted/50 dark:from-muted/20 dark:via-primary/10 dark:to-muted/20">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What Our Users Say</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Hear from travelers who have transformed their booking experience with our AI assistant.
            </p>
          </div>

          <AnimatedTestimonials testimonials={testimonials} />
        </div>
      </section>
    </div>
  )
}

