"use client"

import { useState, useCallback } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AttendanceCodeForm } from "@/components/attendance-code-form"
import { createClient } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

interface QRCodeScannerProps {
  studentId: string
}

export function QRCodeScanner({ studentId }: QRCodeScannerProps) {
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null)

  const startScanner = useCallback(() => {
    setIsScanning(true)

    const html5QrCode = new Html5Qrcode("qr-reader")
    setScanner(html5QrCode)

    html5QrCode
      .start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          // Stop scanning after successful scan
          await html5QrCode.stop()
          setIsScanning(false)
          handleDecode(decodedText)
        },
        (errorMessage) => {
          // Handle scan error silently
          console.log(errorMessage)
        },
      )
      .catch((err) => {
        console.error("Error starting scanner:", err)
        toast({
          variant: "destructive",
          title: "خطأ في تشغيل الماسح",
          description: "لم نتمكن من الوصول إلى الكاميرا، يرجى التأكد من منح الإذن",
        })
        setIsScanning(false)
      })
  }, [])

  const stopScanner = useCallback(() => {
    if (scanner) {
      scanner
        .stop()
        .then(() => {
          setIsScanning(false)
        })
        .catch((error) => {
          console.error("Error stopping scanner:", error)
        })
    }
  }, [scanner])

  const handleDecode = useCallback(
    async (result: string) => {
      if (isProcessing) return
      setIsProcessing(true)

      try {
        // Parse the QR code data
        const data = JSON.parse(result)
        const { code, courseId, sessionId } = data

        // Verify the session
        const { data: session, error: sessionError } = await supabase
          .from("sessions")
          .select("*")
          .eq("id", sessionId)
          .eq("code", code)
          .eq("is_active", true)
          .gt("expires_at", new Date().toISOString())
          .single()

        if (sessionError || !session) {
          throw new Error("رمز الجلسة غير صحيح أو منتهي الصلاحية")
        }

        // Verify student enrollment
        const { data: enrollment, error: enrollmentError } = await supabase
          .from("course_students")
          .select("id")
          .eq("student_id", studentId)
          .eq("course_id", courseId)
          .single()

        if (enrollmentError || !enrollment) {
          throw new Error("أنت غير مسجل في هذه الدورة")
        }

        // Check for existing attendance
        const { data: existingAttendance, error: existingError } = await supabase
          .from("attendance")
          .select("id")
          .eq("student_id", studentId)
          .eq("course_id", courseId)
          .eq("date", session.date)
          .maybeSingle()

        if (existingAttendance) {
          throw new Error("تم تسجيل حضورك مسبقاً لهذه الجلسة")
        }

        // Record attendance
        const { error: attendanceError } = await supabase.from("attendance").insert([
          {
            student_id: studentId,
            course_id: courseId,
            date: session.date,
            status: "present",
          },
        ])

        if (attendanceError) throw attendanceError

        toast({
          title: "تم تسجيل الحضور بنجاح",
          description: "تم تسجيل حضورك للجلسة بنجاح",
        })
      } catch (error: any) {
        console.error("Error processing QR code:", error)
        toast({
          variant: "destructive",
          title: "خطأ في تسجيل الحضور",
          description: error.message || "حدث خطأ أثناء تسجيل الحضور، يرجى المحاولة مرة أخرى",
        })
      } finally {
        setIsProcessing(false)
      }
    },
    [studentId, toast, isProcessing],
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>تسجيل الحضور بواسطة QR</CardTitle>
        <CardDescription>امسح رمز QR لتسجيل حضورك</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div id="qr-reader" className="w-full max-w-sm mx-auto overflow-hidden rounded-lg"></div>

        <div className="flex justify-center">
          {!isScanning ? (
            <Button onClick={startScanner}>بدء المسح</Button>
          ) : (
            <Button variant="destructive" onClick={stopScanner}>
              إيقاف المسح
            </Button>
          )}
        </div>

        <div className="text-center text-sm text-muted-foreground">
          {isProcessing
            ? "جاري معالجة الرمز..."
            : isScanning
              ? "وجه الكاميرا نحو رمز QR لتسجيل الحضور"
              : "اضغط على بدء المسح لتشغيل الكاميرا"}
        </div>

        <AttendanceCodeForm studentId={studentId} />
      </CardContent>
    </Card>
  )
}

