"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { motion } from "framer-motion"
import { createClient } from "@supabase/supabase-js"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

// إنشاء عميل Supabase
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_KEY!)

const formSchema = z.object({
  name: z.string().min(2, {
    message: "يجب أن يكون الاسم حرفين على الأقل",
  }),
  email: z.string().email({
    message: "يرجى إدخال بريد إلكتروني صحيح",
  }),
  password: z.string().min(6, {
    message: "يجب أن تكون كلمة المرور 6 أحرف على الأقل",
  }),
  role: z.enum(["student", "doctor"], {
    required_error: "يرجى اختيار نوع المستخدم",
  }),
})

export function SignupForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "student",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)

    try {
      // التحقق من عدم وجود مستخدم بنفس البريد الإلكتروني
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("email")
        .eq("email", values.email)

      if (checkError) {
        console.error("Error checking existing user:", checkError)
        throw new Error("خطأ في التحقق من وجود المستخدم")
      }

      if (existingUser && existingUser.length > 0) {
        throw new Error("البريد الإلكتروني مستخدم بالفعل")
      }

      // إنشاء حساب في نظام المصادقة
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
      })

      if (error) {
        console.error("Auth signup error:", error)
        throw error
      }

      if (!data.user) {
        throw new Error("فشل إنشاء المستخدم")
      }

      console.log("Auth user created successfully:", data.user.id)

      // إضافة المستخدم إلى جدول المستخدمين
      const { error: userError } = await supabase.from("users").insert([
        {
          id: data.user.id,
          name: values.name,
          email: values.email,
          password: "hashed_password", // في الواقع يجب تشفير كلمة المرور
          role: values.role,
        },
      ])

      if (userError) {
        console.error("Error inserting user:", userError)

        // محاولة حذف المستخدم من نظام المصادقة إذا فشل إنشاء السجل في جدول المستخدمين
        try {
          // لا يمكن حذف المستخدم مباشرة، لكن يمكن تسجيل الخروج
          await supabase.auth.signOut()
        } catch (logoutError) {
          console.error("Error during cleanup:", logoutError)
        }

        throw new Error("فشل إنشاء سجل المستخدم: " + userError.message)
      }

      toast({
        title: "تم إنشاء الحساب بنجاح",
        description: "يمكنك الآن تسجيل الدخول",
      })

      router.push("/")
    } catch (error: any) {
      console.error("Signup error:", error)
      toast({
        variant: "destructive",
        title: "خطأ في إنشاء الحساب",
        description: error.message || "قد يكون البريد الإلكتروني مستخدم بالفعل",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto min-w-[50%]  p-6 bg-card rounded-lg shadow-lg border">
      <h2 className="text-2xl font-bold mb-6 text-center">إنشاء حساب جديد</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الاسم</FormLabel>
                <FormControl>
                  <Input placeholder="محمد أحمد" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>البريد الإلكتروني</FormLabel>
                <FormControl>
                  <Input placeholder="example@raya.edu" {...field} />
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
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>نوع المستخدم</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع المستخدم" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="student">طالب</SelectItem>
                    <SelectItem value="doctor">دكتور</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري إنشاء الحساب...
                </>
              ) : (
                "إنشاء حساب"
              )}
            </Button>
          </motion.div>
          <div className="text-center text-sm">
            لديك حساب بالفعل؟{" "}
            <Link href="/" className="text-primary hover:underline">
              تسجيل الدخول
            </Link>
          </div>
        </form>
      </Form>
    </div>
  )
}
