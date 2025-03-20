"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Camera, CameraOff } from "lucide-react"

interface QRCodeScannerProps {
  studentId: string
}

export function QRCodeScanner({ studentId }: QRCodeScannerProps) {
  const { toast } = useToast()
  const supabase = createClient()
  const [isScanning, setIsScanning] = useState(false)
  const [manualCode, setManualCode] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [html5QrCode, setHtml5QrCode] = useState<Html5Qrcode | null>(null)

  useEffect(() => {
    // تهيئة الماسح
    const qrCodeScanner = new Html5Qrcode("qr-reader")
    setHtml5QrCode(qrCodeScanner)

    // تنظيف عند إلغاء التحميل
    return () => {
      if (qrCodeScanner.isScanning) {
        qrCodeScanner.stop().catch((error) => console.error("Error stopping scanner:", error))
      }
    }
  }, [])

  const startScanner = async () => {
    if (!html5QrCode) return

    setIsScanning(true)
    const config = { fps: 10, qrbox: { width: 250, height: 250 } }

    try {
      await html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess, () => {})
    } catch (error) {
      console.error("Error starting scanner:", error)
      setIsScanning(false)
      toast({
        variant: "destructive",
        title: "خطأ في تشغيل الماسح",
        description: "تعذر الوصول إلى الكاميرا. يرجى التحقق من إذن الكاميرا أو استخدام الإدخال اليدوي.",
      })
    }
  }

  const stopScanner = async () => {
    if (!html5QrCode || !html5QrCode.isScanning) return

    try {
      await html5QrCode.stop()
      setIsScanning(false)
    } catch (error) {
      console.error("Error stopping scanner:", error)
    }
  }

  const onScanSuccess = async (decodedText: string) => {
    // إيقاف المسح بعد المسح الناجح
    await stopScanner()
    // معالجة الرمز
    await processCode(decodedText)
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualCode.trim()) return

    await processCode(manualCode.trim())
    setManualCode("")
  }

  const processCode = async (code: string) => {
    setIsSubmitting(true)

    try {
      // أولاً، تحقق مما إذا كان الرمز صالحًا ونشطًا
      const { data: session, error: sessionError } = await supabase
        .from("sessions")
        .select("*")
        .eq("code", code)
        .eq("is_active", true)
        .single()

      if (sessionError) {
        throw new Error("رمز غير صالح أو منتهي الصلاحية")
      }

      // تحقق مما إذا كانت المحاضرة قد انتهت صلاحيتها
      const now = new Date()
      const expiryDate = new Date(session.expires_at)
      if (now > expiryDate) {
        throw new Error("انتهت صلاحية رمز الحضور")
      }

      // تحقق مما إذا كان الطالب مسجلاً في هذه الدورة
      const { data: enrollment, error: enrollmentError } = await supabase
        .from("course_students")
        .select("*")
        .eq("course_id", session.course_id)
        .eq("student_id", studentId)
        .single()

      if (enrollmentError) {
        throw new Error("أنت غير مسجل في هذه الدورة")
      }

      // تحقق مما إذا كان الطالب قد سجل حضوره بالفعل لهذه المحاضرة المحددة
      const { data: existingAttendance, error: attendanceCheckError } = await supabase
        .from("attendance")
        .select("*")
        .eq("student_id", studentId)
        .eq("session_id", session.id)

      if (!attendanceCheckError && existingAttendance && existingAttendance.length > 0) {
        throw new Error("لقد سجلت حضورك بالفعل لهذه المحاضرة")
      }

      // حساب حالة الحضور بناءً على الوقت
      const sessionCreationTime = new Date(session.created_at).getTime()
      const currentTime = now.getTime()
      const timeDifference = currentTime - sessionCreationTime

      // تحديد الحدود الزمنية (30 دقيقة للتأخير، ساعتان للغياب)
      const lateThreshold = 30 * 60 * 1000 // 30 دقيقة بالميلي ثانية
      const absentThreshold = 2 * 60 * 60 * 1000 // ساعتان بالميلي ثانية

      let status = "present"
      if (timeDifference > absentThreshold) {
        status = "absent"
      } else if (timeDifference > lateThreshold) {
        status = "late"
      }

      // تسجيل الحضور باستخدام معرف المحاضرة
      const { error: insertError } = await supabase.from("attendance").insert({
        student_id: studentId,
        course_id: session.course_id,
        date: session.date,
        status,
        session_id: session.id, // استخدام معرف المحاضرة
      })

      if (insertError) throw insertError

      // عرض رسالة نجاح
      toast({
        title: "تم تسجيل الحضور",
        description:
          status === "present"
            ? "تم تسجيل حضورك بنجاح"
            : status === "late"
              ? "تم تسجيل حضورك بنجاح (متأخر)"
              : "تم تسجيل حضورك ولكن تم اعتبارك غائباً بسبب التأخير الشديد",
      })
    } catch (error: any) {
      console.error("Error processing code:", error)
      toast({
        variant: "destructive",
        title: "خطأ في تسجيل الحضور",
        description: error.message || "حدث خطأ أثناء تسجيل الحضور",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div id="qr-reader" className="w-full max-w-sm mx-auto overflow-hidden rounded-lg"></div>

      <div className="flex justify-center">
        {isScanning ? (
          <Button variant="outline" onClick={stopScanner} disabled={isSubmitting}>
            <CameraOff className="ml-2 h-4 w-4" />
            إيقاف المسح
          </Button>
        ) : (
          <Button onClick={startScanner} disabled={isSubmitting}>
            <Camera className="ml-2 h-4 w-4" />
            بدء المسح
          </Button>
        )}
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">أو</p>
      </div>

      <form onSubmit={handleManualSubmit} className="space-y-2">
        <Label htmlFor="manual-code">إدخال الرمز يدوياً</Label>
        <div className="flex gap-2">
          <Input
            id="manual-code"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="أدخل رمز الحضور"
            disabled={isSubmitting}
          />
          <Button type="submit" disabled={!manualCode.trim() || isSubmitting}>
            {isSubmitting ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
            إرسال
          </Button>
        </div>
      </form>
    </div>
  )
}

