"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { MoreHorizontal, Check, Clock, X } from "lucide-react"

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
  onRecordUpdated?: () => void
}

export function AttendanceTable({ records, onRecordUpdated }: AttendanceTableProps) {
  const { toast } = useToast()
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const supabase = createClient()

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

  const updateAttendanceStatus = async (recordId: string, status: "present" | "absent" | "late") => {
    setIsUpdating(recordId)
    try {
      const { error } = await supabase.from("attendance").update({ status }).eq("id", recordId)

      if (error) throw error

      toast({
        title: "تم تحديث الحضور",
        description: "تم تحديث حالة الحضور بنجاح",
      })

      // Update the local state or refetch
      if (onRecordUpdated) {
        onRecordUpdated()
      }
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
                          <DropdownMenuItem onClick={() => updateAttendanceStatus(record.id, "present")}>
                            <Check className="ml-2 h-4 w-4 text-green-600" />
                            تعيين كحاضر
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateAttendanceStatus(record.id, "late")}>
                            <Clock className="ml-2 h-4 w-4 text-yellow-600" />
                            تعيين كمتأخر
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateAttendanceStatus(record.id, "absent")}>
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

