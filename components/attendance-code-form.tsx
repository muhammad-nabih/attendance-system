"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

interface AttendanceCodeFormProps {
  studentId: string
}

export function AttendanceCodeForm({ studentId }: AttendanceCodeFormProps) {
  const [sessionCode, setSessionCode] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // استخدام createBrowserClient مباشرة بدلاً من استدعاء createClient
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_KEY!)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!sessionCode.trim()) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "الرجاء إدخال رمز الجلسة",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // التحقق من جلسة المستخدم
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        throw new Error("يرجى تسجيل الدخول أولاً")
      }

      // التحقق من رمز الجلسة
      const { data: sessionData, error: sessionError } = await supabase
        .from("sessions")
        .select("*")
        .eq("code", sessionCode)
        .eq("is_active", true)
        .gt("expires_at", new Date().toISOString())
        .single()

      if (sessionError || !sessionData) {
        throw new Error("رمز الجلسة غير صحيح أو منتهي الصلاحية")
      }

      // التحقق من تسجيل الطالب في الدورة
      const { data: enrollment, error: enrollmentError } = await supabase
        .from("course_students")
        .select("id")
        .eq("student_id", studentId)
        .eq("course_id", sessionData.course_id)
        .single()

      if (enrollmentError || !enrollment) {
        throw new Error("أنت غير مسجل في هذه الدورة")
      }

      // التحقق من عدم وجود سجل حضور سابق
      const { data: existingAttendance, error: existingError } = await supabase
        .from("attendance")
        .select("id")
        .eq("student_id", studentId)
        .eq("course_id", sessionData.course_id)
        .eq("date", sessionData.date)
        .maybeSingle()

      if (existingAttendance) {
        throw new Error("تم تسجيل حضورك مسبقاً لهذه الجلسة")
      }

      // تسجيل الحضور
      console.log("Inserting attendance record:", {
        student_id: studentId,
        course_id: sessionData.course_id,
        date: sessionData.date,
        status: "present",
      })

      const { error: attendanceError } = await supabase.from("attendance").insert([
        {
          student_id: studentId,
          course_id: sessionData.course_id,
          date: sessionData.date,
          status: "present",
        },
      ])

      if (attendanceError) {
        console.error("Attendance insert error:", attendanceError)
        throw new Error(`خطأ في تسجيل الحضور: ${attendanceError.message}`)
      }

      toast({
        title: "تم تسجيل الحضور بنجاح",
        description: "تم تسجيل حضورك للجلسة بنجاح",
      })

      setSessionCode("")
    } catch (error: any) {
      console.error("Error recording attendance:", error)
      toast({
        variant: "destructive",
        title: "خطأ في تسجيل الحضور",
        description: error.message || "حدث خطأ أثناء تسجيل الحضور، يرجى المحاولة مرة أخرى",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>تسجيل الحضور</CardTitle>
        <CardDescription>أدخل رمز الجلسة لتسجيل حضورك</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Input
              id="sessionCode"
              placeholder="أدخل رمز الجلسة"
              value={sessionCode}
              onChange={(e) => setSessionCode(e.target.value)}
              disabled={isSubmitting}
              className="text-center text-lg tracking-widest"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري التسجيل...
              </>
            ) : (
              "تسجيل الحضور"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground text-center">
        يمكنك الحصول على رمز الجلسة من المحاضر
      </CardFooter>
    </Card>
  )
}

