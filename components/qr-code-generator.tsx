"use client"

import { useState } from "react"

import QRCodeReact from "react-qr-code"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Clipboard, Check } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@supabase/supabase-js"
import { useUser } from "@/providers/userContext"



interface QRCodeGeneratorProps {
  courses: {
    id: string
    name: string
  }[]
}

export function QRCodeGenerator({ courses }: QRCodeGeneratorProps) {
  const { toast } = useToast()
  const [selectedCourse, setSelectedCourse] = useState("")
  const [sessionId, setSessionId] = useState("1")
  const [copied, setCopied] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedCode, setGeneratedCode] = useState("")
  const [qrData, setQrData] = useState("")
  const {supabase} = useUser()

  // Generate a unique session code
  const generateSessionCode = async () => {
    if (!selectedCourse) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "الرجاء اختيار المادة أولاً",
      })
      return
    }

    setIsGenerating(true)

    try {
      // Get the current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError) throw userError

      // Generate a random 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString()

      // Create a new session
      const { data: session, error: sessionError } = await supabase
        .from("sessions")
        .insert([
          {
            code,
            course_id: selectedCourse,
            date: new Date().toISOString().split("T")[0],
            session_number: Number.parseInt(sessionId),
            created_by: user?.id,
            expires_at: new Date(Date.now() + 3600000).toISOString(), // Expires in 1 hour
            is_active: true,
          },
        ])
        .select()
        .single()

      if (sessionError) throw sessionError

      // Generate QR data
      const qrData = JSON.stringify({
        code,
        courseId: selectedCourse,
        sessionId: session.id,
      })

      setGeneratedCode(code)
      setQrData(qrData)

      toast({
        title: "تم إنشاء الرمز بنجاح",
        description: "يمكن للطلاب استخدام هذا الرمز لتسجيل الحضور",
      })
    } catch (error: any) {
      console.error("Error generating session code:", error)
      toast({
        variant: "destructive",
        title: "خطأ في إنشاء الرمز",
        description: error.message || "حدث خطأ أثناء إنشاء رمز الجلسة، يرجى المحاولة مرة أخرى",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyCode = () => {
    if (!generatedCode) return

    navigator.clipboard.writeText(generatedCode)
    setCopied(true)

    toast({
      title: "تم النسخ",
      description: "تم نسخ رمز الحضور إلى الحافظة",
    })

    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>إنشاء رمز QR للحضور</CardTitle>
        <CardDescription>قم بإنشاء رمز QR للطلاب لتسجيل حضورهم</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="course">المادة</Label>
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger id="course">
              <SelectValue placeholder="اختر المادة" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="session">رقم المحاضرة</Label>
          <Select value={sessionId} onValueChange={setSessionId}>
            <SelectTrigger id="session">
              <SelectValue placeholder="اختر رقم المحاضرة" />
            </SelectTrigger>
            <SelectContent>
              {[...Array(16)].map((_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>
                  المحاضرة {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button className="w-full" onClick={generateSessionCode} disabled={isGenerating || !selectedCourse}>
          {isGenerating ? "جاري إنشاء الرمز..." : "إنشاء رمز الحضور"}
        </Button>

        {qrData && (
          <>
            <div className="flex justify-center py-4">
              <div className="bg-white p-4 rounded-lg">
                <QRCodeReact value={qrData} size={200} level="H" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>رمز الحضور للإدخال اليدوي</Label>
              <div className="flex items-center">
                <div className="flex-1 p-2 border rounded-l-md bg-muted font-mono text-xl text-center overflow-x-auto whitespace-nowrap">
                  {generatedCode}
                </div>
                <Button variant="outline" size="icon" className="rounded-l-none" onClick={handleCopyCode}>
                  {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                يمكن للطلاب إدخال هذا الرمز يدويًا إذا واجهوا مشاكل في مسح رمز QR
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
