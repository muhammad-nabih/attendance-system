// Attendance code generator component

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Clipboard, Check, QrCode } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"


interface AttendanceCodeGeneratorProps {
  courses: {
    id: string
    name: string
  }[]
}

export function AttendanceCodeGenerator({ courses }: AttendanceCodeGeneratorProps) {
  const { toast } = useToast()
  const [selectedCourse, setSelectedCourse] = useState("")
  const [sessionId, setSessionId] = useState("1")
  const [copied, setCopied] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedCode, setGeneratedCode] = useState("")
const supabase = createClient()
  // Obtener la fecha actual en formato YYYY-MM-DD
  const today = new Date().toISOString().split("T")[0]

  // Generar un código de sesión único
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
      // Generar un código aleatorio de 6 dígitos
      const randomCode = Math.floor(100000 + Math.random() * 900000).toString()
      const sessionCode = `${randomCode}`

      // Guardar la sesión en la base de datos
      const { data, error } = await supabase
        .from("sessions")
        .insert({
          code: sessionCode,
          course_id: selectedCourse,
          date: today,
          session_number: Number.parseInt(sessionId),
          created_by: (await supabase.auth.getUser()).data.user?.id,
          expires_at: new Date(Date.now() + 3600000).toISOString(), // Expira en 1 hora
        })
        .select()

      if (error) throw error

      setGeneratedCode(sessionCode)
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
        <CardTitle>إنشاء رمز حضور</CardTitle>
        <CardDescription>قم بإنشاء رمز للطلاب لتسجيل حضورهم</CardDescription>
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

        {generatedCode && (
          <div className="mt-4 space-y-4">
            <div className="flex justify-center py-4">
              <div className="bg-primary/10 p-6 rounded-lg text-center">
                <QrCode className="mx-auto h-16 w-16 mb-4 text-primary" />
                <div className="text-3xl font-bold tracking-wider">{generatedCode}</div>
                <p className="text-sm text-muted-foreground mt-2">رمز الحضور</p>
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
              <p className="text-sm text-muted-foreground">يمكن للطلاب إدخال هذا الرمز لتسجيل حضورهم</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

