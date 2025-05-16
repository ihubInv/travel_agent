// "use client"

// import { useTheme } from "next-themes"
// import { Button } from "@/components/ui/button"
// import { Moon, Sun } from "lucide-react"

// export default function ThemeToggle() {
//   const { theme, setTheme } = useTheme()

//   return (
//     <Button
//       variant="ghost"
//       size="icon"
//       onClick={() => setTheme(theme === "light" ? "dark" : "light")}
//       className="rounded-full"
//       aria-label="Toggle theme"
//     >
//       {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
//     </Button>
//   )
// }




'use client'

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null // prevent SSR/CSR mismatch

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="rounded-full"
      aria-label="Toggle theme"
    >
      {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </Button>
  )
}
