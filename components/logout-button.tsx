"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { createClient } from "@supabase/supabase-js"

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

// إنشاء عميل Supabase
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_KEY!)

interface LogoutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

export function LogoutButton({ variant = "outline", size = "sm" }: LogoutButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signOut()

      if (error) throw error

      toast({
        title: "تم تسجيل الخروج بنجاح",
      })

      // تحديث الصفحة للسماح للوسيط بإعادة التوجيه
      router.refresh()
      router.push("/")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "خطأ في تسجيل الخروج",
        description: error.message || "حدث خطأ أثناء تسجيل الخروج، يرجى المحاولة مرة أخرى",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button variant={variant} size={size} onClick={handleLogout} disabled={isLoading}>
      <LogOut className="ml-2 h-4 w-4" />
      {isLoading ? "جاري تسجيل الخروج..." : "تسجيل الخروج"}
    </Button>
  )
}

