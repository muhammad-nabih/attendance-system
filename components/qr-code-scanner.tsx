"use client"

import { useState, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"
// FIXME: THIS WILL NOT WORK
// import { QrScanner } from "@yudiel/react-qr-scanner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AttendanceCodeForm } from "@/components/attendance-code-form"

interface QRCodeScannerProps {
  studentId: string
}

export function QRCodeScanner({ studentId }: any) {
  const { toast } = useToast()
  const [scanResult, setScanResult] = useState<string | null>(null)

  const handleDecode = useCallback((result: string) => {
    setScanResult(result)
  }, [])

  const handleError = useCallback(
    (error: any) => {
      console.error("QR code scan error:", error)
      toast({
        variant: "destructive",
        title: "خطأ في المسح",
        description: "حدث خطأ أثناء مسح رمز QR، يرجى المحاولة مرة أخرى",
      })
    },
    [toast],
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>تسجيل الحضور بواسطة QR</CardTitle>
        <CardDescription>امسح رمز QR لتسجيل حضورك</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">

        //FIXME - THIS WILL NOT WORK
        {/* <div className="relative">
          <QrScanner onDecode={handleDecode} onError={handleError} style={{ width: "100%" }} scanDelay={500} />
        </div> */}

        {scanResult ? (
          <div className="text-center">
            <p>تم المسح بنجاح:</p>
            <p className="font-bold">{scanResult}</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-muted-foreground">وجه الكاميرا نحو رمز QR لتسجيل الحضور</p>
          </div>
        )}
        <AttendanceCodeForm studentId={studentId} />
      </CardContent>
    </Card>
  )
}
