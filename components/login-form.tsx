"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { motion } from "framer-motion"

import { Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"


const formSchema = z.object({
    email: z.string().email({
        message: "يرجى إدخال بريد إلكتروني صحيح",
    }),
    password: z.string().min(6, {
        message: "يجب أن تكون كلمة المرور 6 أحرف على الأقل",
    }),
})

interface LoginFormProps {
    onSuccess?: () => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
    const router = useRouter()
    const { toast } = useToast()
    const [isLoading, setIsLoading] = useState(false)
    const supabase = createClient()
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)

        try {

            const { data, error } = await supabase.auth.signInWithPassword({
                email: values.email,
                password: values.password,
            })

            if (error) {
                toast({
                    title: "فشل تسجيل الدخول",
                    description:error?.message|| "مشكلة في عملية تسجيل الدخول" ,
                    variant:"destructive"
                })
            }
            if (!data.user) throw new Error("فشل تسجيل الدخول")

            // جلب بيانات المستخدم باستخدام ID
            const { data: userData, error: userError } = await supabase
                .from("users")
                .select("*")
                .eq("id", data.user.id)
                .single()

            // إذا لم يوجد مستخدم، ننشئ سجلًا جديدًا
            if (userError?.code === 'PGRST116') {
                const { data: newUser } = await supabase
                    .from("users")
                    .insert({
                        id: data.user.id,
                        email: data.user.email,
                        name: data.user.email?.split("@")[0] || "مستخدم جديد",
                        role: "student",
                    })
                    .select()
                    .single()
                    console.log("we have a error int login form ")

                if (!newUser) throw new Error("فشل إنشاء سجل المستخدم")
            } else if (userError) {
                throw userError
            }

            toast({
                title: "تم تسجيل الدخول بنجاح",
                description: "جاري تحويلك إلى لوحة التحكم",
            })

            // تحديث الصفحة لإعادة التحقق من الجلسة
            router.refresh()

            // التوجيه بعد تأخير بسيط
            setTimeout(() => {
                router.push(userData?.role === "doctor" ? "/doctor-dash" : "/student-dash")
            }, 1000)

        } catch (error: any) {
            console.error("Login error:", error)
            toast({
                variant: "destructive",
                title: "خطأ في تسجيل الدخول",
                description: error.message || "بيانات الاعتماد غير صحيحة",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

                <motion.div whileTap={{ scale: 0.98 }}>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                            <div className="flex items-center justify-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                جاري التحقق...
                            </div>
                        ) : (
                            "تسجيل الدخول"
                        )}
                    </Button>
                </motion.div>

                <div className="text-center text-sm">
                    ليس لديك حساب؟ {" "}
                    <Link
                        href="/signup"
                        className="text-primary hover:underline font-medium"
                    >
                        سجل الآن
                    </Link>
                </div>
            </form>
        </Form>
    )
}
