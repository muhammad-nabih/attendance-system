"use client"

import { useState } from "react"
// import { QRCode } from "qrcode.react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Clipboard, Check } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { QRCodeScanner } from "@/components/qr-code-scanner"

interface QRCodeGeneratorProps {
  courses: {
    id: string
    name: string
  }[]
}

export default function QRCodeGenerator({ courses }: any) {
  const { toast } = useToast()
  const [selectedCourse, setSelectedCourse] = useState("")
  const [sessionId, setSessionId] = useState("1")
  const [copied, setCopied] = useState(false)

  // Obtener la fecha actual en formato YYYY-MM-DD
  const today = new Date().toISOString().split("T")[0]

  // Generar los datos para el código QR
  const qrData = selectedCourse
    ? JSON.stringify({
        courseId: selectedCourse,
        date: today,
        sessionId: sessionId,
      })
    : ""

  // Generar el código de sesión para entrada manual
  const sessionCode = selectedCourse ? `${selectedCourse}-${today}-${sessionId}` : ""

  const handleCopyCode = () => {
    if (!sessionCode) return

    navigator.clipboard.writeText(sessionCode)
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
              {courses.map((course:any) => (
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

        {selectedCourse && (
          <>
            <div className="flex justify-center py-4">
              <div className="bg-white p-4 rounded-lg">
                <QRCodeScanner value={qrData} size={200} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>رمز الحضور للإدخال اليدوي</Label>
              <div className="flex items-center">
                <div className="flex-1 p-2 border rounded-l-md bg-muted font-mono text-sm overflow-x-auto whitespace-nowrap dir-ltr">
                  {sessionCode}
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
