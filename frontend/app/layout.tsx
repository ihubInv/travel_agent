import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/components/auth-provider'
import Link from 'next/link'
import NavBar from '@/components/nav-bar'
import GoogleSignInScript from '@/components/google-signin-script'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FlightAI - Your AI Flight Assistant',
  description: 'Book flights and manage your travel with AI assistance',
  generator: 'v0.dev',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <GoogleSignInScript />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <div className="relative flex min-h-screen flex-col">
              <NavBar />
              <main className="flex-1">{children}</main>
              <footer className="border-t py-6 md:py-0 bg-gradient-to-r from-background to-primary/5 dark:from-background dark:to-primary/10">
                <div className="container mx-auto px-4">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:h-16">
                    <div className="text-center md:text-left">
                      <p className="text-sm text-muted-foreground">
                        &copy; {new Date().getFullYear()} FlightAI. All rights reserved.
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
                        Terms
                      </Link>
                      <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
                        Privacy
                      </Link>
                    </div>
                  </div>
                </div>
              </footer>
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

import './globals.css'