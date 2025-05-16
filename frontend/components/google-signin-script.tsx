"use client"

import Script from 'next/script'

export default function GoogleSignInScript() {
  return (
    <>
      <link
        rel="preload"
        href="https://accounts.google.com/gsi/client"
        as="script"
        crossOrigin="anonymous"
      />
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onError={(e) => {
          console.error('Error loading Google Sign-In script:', e)
        }}
      />
    </>
  )
} 