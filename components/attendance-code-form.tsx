"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

import { Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface AttendanceCodeFormProps {
  studentId: string
}

export function AttendanceCodeForm({ studentId }: AttendanceCodeFormProps) {
  const [sessionCode, setSessionCode] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
const supabase = createClient()
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
      // Verificar si el código es válido y no ha expirado
      const { data: sessionData, error: sessionError } = await supabase
        .from("sessions")
        .select("id, course_id, date")
        .eq("code", sessionCode)
        .eq("is_active", true)
        .gt("expires_at", new Date().toISOString())
        .single()

      if (sessionError || !sessionData) {
        throw new Error("رمز الجلسة غير صحيح أو منتهي الصلاحية")
      }

      // Verificar si el estudiante está inscrito en este curso
      const { data: courseStudent, error: courseStudentError } = await supabase
        .from("course_students")
        .select("id")
        .eq("student_id", studentId)
        .eq("course_id", sessionData.course_id)
        .single()

      if (courseStudentError || !courseStudent) {
        throw new Error("أنت غير مسجل في هذه الدورة")
      }

      // Verificar si ya se ha registrado asistencia para esta sesión
      const { data: existingAttendance, error: existingAttendanceError } = await supabase
        .from("attendance")
        .select("id")
        .eq("student_id", studentId)
        .eq("session_id", sessionData.id)
        .maybeSingle()

      if (existingAttendance) {
        throw new Error("تم تسجيل حضورك مسبقاً لهذه الجلسة")
      }

      // Registrar la asistencia
      const { error: insertError } = await supabase.from("attendance").insert({
        student_id: studentId,
        course_id: sessionData.course_id,
        session_id: sessionData.id,
        date: sessionData.date,
        status: "present",
      })

      if (insertError) throw insertError

      toast({
        title: "تم تسجيل الحضور بنجاح",
        description: "تم تسجيل حضورك للجلسة بنجاح",
      })

      // Limpiar el formulario
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
