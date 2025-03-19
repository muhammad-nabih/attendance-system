"use client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2 } from "lucide-react"
import { useMutation } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"

const formSchema = z.object({
  email: z.string().email({
    message: "يرجى إدخال بريد إلكتروني صحيح",
  }),
  password: z.string().min(6, {
    message: "يجب أن تكون كلمة المرور 6 أحرف على الأقل",
  }),
})

type LoginFormValues = z.infer<typeof formSchema>

export function LoginForm() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const loginMutation = useMutation({
    mutationFn: async (values: LoginFormValues) => {
      // Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (error) throw error

      // Get user details from the users table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", data.user.id)
        .single()

      if (userError) throw userError

      return userData
    },
    onSuccess: (userData) => {
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحباً بك مرة أخرى!",
      })

      // Redirect based on user role
      if (userData.role === "doctor") {
        router.push("/doctor-dash")
      } else if (userData.role === "student") {
        router.push("/student-dash")
      } else {
        router.push("/")
      }
    },
    onError: (error: Error) => {
      console.error("Login error:", error)
      console.log("we have the error message ")
      toast({
        variant: "destructive",
        title: "خطأ في تسجيل الدخول",
        description: "البريد الإلكتروني أو كلمة المرور غير صحيحة",

      })
    },
  })

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  function onSubmit(values: LoginFormValues) {
    loginMutation.mutate(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>البريد الإلكتروني</FormLabel>
              <FormControl>
                <Input placeholder="example@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>كلمة المرور</FormLabel>
              <FormControl>
                <Input type="password" placeholder="******" {...field} />
              </FormControl>
              <FormMessage />
              <div className="text-sm text-right">
                <Link href="/forgot-password" className="text-primary hover:underline">
                  نسيت كلمة المرور؟
                </Link>
              </div>
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? (
            <>
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              جاري تسجيل الدخول...
            </>
          ) : (
            "تسجيل الدخول"
          )}
        </Button>
      </form>
      <div className="mt-4 text-center text-sm">
        ليس لديك حساب؟{" "}
        <Link href="/signup" className="text-primary hover:underline">
          إنشاء حساب جديد
        </Link>
      </div>
    </Form>
  )
}
