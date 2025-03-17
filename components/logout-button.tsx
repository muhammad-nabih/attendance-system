"use client"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

interface LogoutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

export function LogoutButton({ variant = "outline", size = "sm" }: LogoutButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const supabase = createClient()

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return true
    },
    onSuccess: () => {
      // Invalidar todas las consultas para limpiar el caché
      queryClient.clear()

      toast({
        title: "تم تسجيل الخروج بنجاح",
      })

      // Redirigir al usuario a la página de inicio
      router.refresh()
 location.href="/"
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "خطأ في تسجيل الخروج",
        description: error.message || "حدث خطأ أثناء تسجيل الخروج، يرجى المحاولة مرة أخرى",
      })
    },
  })

  return (
    <Button variant={variant} size={size} onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending}>
      <LogOut className="ml-2 h-4 w-4" />
      {logoutMutation.isPending ? "جاري تسجيل الخروج..." : "تسجيل الخروج"}
    </Button>
  )
}
