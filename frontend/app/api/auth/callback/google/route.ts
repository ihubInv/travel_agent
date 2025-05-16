import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  
  if (!code) {
    return NextResponse.redirect(new URL("/login?error=no_code", request.url))
  }
  
  try {
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
      return NextResponse.redirect(new URL("/login?error=token_exchange_failed", request.url))
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
      return NextResponse.redirect(new URL("/login?error=user_info_failed", request.url))
    }
    
    const userInfo = await userInfoResponse.json()
    
    // Create a credential object similar to what the Google Sign-In button would provide
    const credential = {
      credential: tokenData.id_token,
      select_by: "btn",
      g_csrf_token: null,
    }
    
    // Call your backend API to authenticate the user
    const authResponse = await fetch("http://localhost:5000/api/google-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        credential: credential.credential,
      }),
    })
    
    if (!authResponse.ok) {
      const errorData = await authResponse.json()
      console.error("Authentication error:", errorData)
      return NextResponse.redirect(new URL("/login?error=authentication_failed", request.url))
    }
    
    const authData = await authResponse.json()
    
    // Create a response that redirects to the chat page
    const response = NextResponse.redirect(new URL("/chat", request.url))
    
    // Set the token in a cookie for authentication
    response.cookies.set("token", authData.data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    })
    
    // Also set the user data in localStorage via a script
    const script = `
      <script>
        localStorage.setItem("token", "${authData.data.token}");
        localStorage.setItem("user", '${JSON.stringify(authData.data.user)}');
        window.location.href = "/chat";
      </script>
    `
    
    return new Response(script, {
      headers: {
        "Content-Type": "text/html",
      },
    })
  } catch (error) {
    console.error("Callback error:", error)
    return NextResponse.redirect(new URL("/login?error=unknown", request.url))
  }
} 