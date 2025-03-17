"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { MoreHorizontal, Check, Clock, X } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { updateAttendanceStatus } from "@/hooks/use-realtime-queries"

interface AttendanceRecord {
  id: string
  date: string
  status: "present" | "absent" | "late"
  student: {
    id: string
    name: string
    email: string
  }
}

interface AttendanceTableProps {
  records: AttendanceRecord[]
  courseId?: string
}

export function AttendanceTable({ records }: AttendanceTableProps) {
  const { toast } = useToast()
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const queryClient = useQueryClient()

  // Group records by date
  const recordsByDate = records.reduce(
    (acc, record) => {
      const date = record.date
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(record)
      return acc
    },
    {} as Record<string, AttendanceRecord[]>,
  )

  // Sort dates in descending order
  const sortedDates = Object.keys(recordsByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  const handleUpdateAttendanceStatus = async (recordId: string, status: "present" | "absent" | "late") => {
    setIsUpdating(recordId)
    try {
      await updateAttendanceStatus(recordId, status)

      toast({
        title: "تم تحديث الحضور",
        description: "تم تحديث حالة الحضور بنجاح",
      })

      // No es necesario invalidar la consulta aquí, ya que la suscripción en tiempo real lo hará
      // Sin embargo, podemos hacerlo para asegurar una actualización inmediata
      queryClient.invalidateQueries({ queryKey: ["course-attendance"] })
      queryClient.invalidateQueries({ queryKey: ["student-attendance"] })
    } catch (error: any) {
      console.error("Error updating attendance:", error)
      toast({
        variant: "destructive",
        title: "خطأ في تحديث الحضور",
        description: error.message || "حدث خطأ أثناء تحديث حالة الحضور",
      })
    } finally {
      setIsUpdating(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <Check className="h-4 w-4 text-green-600" />
      case "late":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "absent":
        return <X className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "present":
        return "حاضر"
      case "late":
        return "متأخر"
      case "absent":
        return "غائب"
      default:
        return status
    }
  }

  if (records.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">لا توجد سجلات حضور حتى الآن</div>
  }

  return (
    <div className="space-y-8">
      {sortedDates.map((date) => (
        <div key={date} className="space-y-2">
          <h3 className="font-medium text-lg">
            {new Date(date).toLocaleDateString("ar-EG", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الطالب</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recordsByDate[date].map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.student.name}</TableCell>
                    <TableCell>{record.student.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(record.status)}
                        <span
                          className={`
                          ${
                            record.status === "present"
                              ? "text-green-600"
                              : record.status === "late"
                                ? "text-yellow-600"
                                : "text-red-600"
                          }
                        `}
                        >
                          {getStatusText(record.status)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={isUpdating === record.id}>
                            {isUpdating === record.id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleUpdateAttendanceStatus(record.id, "present")}>
                            <Check className="ml-2 h-4 w-4 text-green-600" />
                            تعيين كحاضر
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateAttendanceStatus(record.id, "late")}>
                            <Clock className="ml-2 h-4 w-4 text-yellow-600" />
                            تعيين كمتأخر
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateAttendanceStatus(record.id, "absent")}>
                            <X className="ml-2 h-4 w-4 text-red-600" />
                            تعيين كغائب
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}
    </div>
  )
}

