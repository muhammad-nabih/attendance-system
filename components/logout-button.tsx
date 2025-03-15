"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/providers/userContext"

interface LogoutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

export function LogoutButton({ variant = "outline", size = "sm" }: LogoutButtonProps) {
  const { user } = useUser()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)

    try {
      // Call the server-side sign-out route
      const response = await fetch('/auth/signout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('حدث خطأ أثناء تسجيل الخروج')
      }

      toast({
        title: "تم تسجيل الخروج بنجاح",
      })


      router.refresh()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "خطأ في تسجيل الخروج",
        description: error.message || "حدث خطأ أثناء تسجيل الخروج، يرجى المحاولة مرة أخرى",
      })
      setIsLoading(false)
    }
  }

  // Only show the logout button if a user is logged in
  if (!user) return null

  return (
    <Button variant={variant} size={size} onClick={handleLogout} disabled={isLoading}>
      <LogOut className="ml-2 h-4 w-4" />
      {isLoading ? "جاري تسجيل الخروج..." : "تسجيل الخروج"}
    </Button>
  )
}
