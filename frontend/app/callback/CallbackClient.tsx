"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Loader2 } from "lucide-react"

export default function CallbackClient() {
  const [error, setError] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const { googleLogin } = useAuth()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the authorization code from the URL
        const code = searchParams.get("code")
        
        if (!code) {
          setError("No authorization code received from Google")
          return
        }
        
        // Exchange the code for tokens
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            code,
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
            client_secret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET || "",
            redirect_uri: "http://localhost:3000/api/auth/callback/google",
            grant_type: "authorization_code",
          }),
        })
        
        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.json()
          console.error("Token exchange error:", errorData)
          setError("Failed to exchange authorization code for tokens")
          return
        }
        
        const tokenData = await tokenResponse.json()
        
        // Get user info using the access token
        const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        })
        
        if (!userInfoResponse.ok) {
          const errorData = await userInfoResponse.json()
          console.error("User info error:", errorData)
          setError("Failed to get user information")
          return
        }
        
        const userInfo = await userInfoResponse.json()
        
        // Create a credential object similar to what the Google Sign-In button would provide
        const credential = {
          credential: tokenData.id_token,
          select_by: "btn",
          g_csrf_token: null,
        }
        
        // Use the existing googleLogin function
        const success = await googleLogin(credential.credential)
        
        if (success) {
          router.push("/profile")
        } else {
          setError("Failed to authenticate with Google")
        }
      } catch (err) {
        console.error("Callback error:", err)
        setError("An error occurred during authentication")
      }
    }
    
    handleCallback()
  }, [searchParams, googleLogin, router])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {error ? (
        <div className="text-red-500 mb-4">{error}</div>
      ) : (
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p>Completing sign in...</p>
        </div>
      )}
    </div>
  )
} 
