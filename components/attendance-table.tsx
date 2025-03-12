"use client"

import { useState } from "react"
import { Check, X, Clock, Filter, Search } from "lucide-react"
import { createClient } from "@supabase/supabase-js"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// إنشاء عميل Supabase
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_KEY!)

interface AttendanceTableProps {
  attendanceRecords: any[]
  students: any[]
  courseId: string
  date: string
}

export function AttendanceTable({ attendanceRecords, students, courseId, date }: AttendanceTableProps) {
  const { toast } = useToast()
  const [isUpdating, setIsUpdating] = useState<Record<string, boolean>>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // تغيير حالة الحضور
  const handleStatusChange = async (studentId: string, status: "present" | "absent" | "late", recordId?: string) => {
    if (!courseId) return

    setIsUpdating({ ...isUpdating, [studentId]: true })

    try {
      if (recordId) {
        // تحديث سجل موجود
        const { error } = await supabase.from("attendance").update({ status }).eq("id", recordId)

        if (error) throw error
      } else {
        // إنشاء سجل جديد
        const { error } = await supabase.from("attendance").insert([
          {
            student_id: studentId,
            course_id: courseId,
            date,
            status,
            session_id: new Date().toISOString(), // استخدام الوقت الحالي كمعرف للجلسة
          },
        ])

        if (error) throw error
      }

      toast({
        title: "تم تحديث الحضور بنجاح",
        description: `تم تحديث حالة الطالب إلى ${
          status === "present" ? "حاضر" : status === "absent" ? "غائب" : "متأخر"
        }`,
        variant: "default",
      })

      // إعادة تحميل البيانات
      const { data, error } = await supabase
        .from("attendance")
        .select("id, student_id, course_id, date, status, created_at, session_id")
        .eq("course_id", courseId)
        .order("date", { ascending: false })

      if (error) throw error

      // تحديث البيانات في الواجهة
      attendanceRecords = data || []
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "خطأ في تحديث الحضور",
        description: error.message || "حدث خطأ أثناء تحديث حالة الحضور، يرجى المحاولة مرة أخرى",
      })
    } finally {
      setIsUpdating({ ...isUpdating, [studentId]: false })
    }
  }

  // الحصول على حالة حضور طالب معين في تاريخ معين
  const getStudentAttendanceStatus = (
    studentId: string,
  ): { status: "present" | "absent" | "late" | null; recordId: string | null } => {
    const record = attendanceRecords.find((record) => record.student_id === studentId && record.date === date)

    return record ? { status: record.status, recordId: record.id } : { status: null, recordId: null }
  }

  // الحصول على الحرف الأول من اسم المستخدم
  const getInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : "U"
  }

  // تصفية الطلاب حسب البحث والحالة
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())

    if (statusFilter === "all") return matchesSearch

    const { status } = getStudentAttendanceStatus(student.id)
    return matchesSearch && status === statusFilter
  })

  if (!students || students.length === 0) {
    return <div className="flex justify-center p-4">لا يوجد طلاب في هذه الدورة</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="بحث عن طالب..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-3 pr-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="تصفية حسب الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="present">حاضر</SelectItem>
            <SelectItem value="absent">غائب</SelectItem>
            <SelectItem value="late">متأخر</SelectItem>
            <SelectItem value={""}>غير مسجل</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">الرقم</TableHead>
              <TableHead>اسم الطالب</TableHead>
              <TableHead>البريد الإلكتروني</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead className="text-left">تغيير الحالة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.map((student, index) => {
              const { status, recordId } = getStudentAttendanceStatus(student.id)

              return (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={`https://api.dicebear.com/7.x/initials/svg?seed=${student.name}`}
                          alt={student.name}
                        />
                        <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                      </Avatar>
                      <span>{student.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>
                    {status === "present" ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        <Check className="ml-2 h-4 w-4 text-green-500" />
                        <span>حاضر</span>
                      </Badge>
                    ) : status === "absent" ? (
                      <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                        <X className="ml-2 h-4 w-4 text-red-500" />
                        <span>غائب</span>
                      </Badge>
                    ) : status === "late" ? (
                      <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                        <Clock className="ml-2 h-4 w-4 text-yellow-500" />
                        <span>متأخر</span>
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">غير مسجل</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" disabled={isUpdating[student.id]}>
                            {isUpdating[student.id] ? (
                              "جاري التحديث..."
                            ) : (
                              <>
                                <Filter className="ml-2 h-4 w-4" />
                                تغيير الحالة
                              </>
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(student.id, "present", recordId || undefined)}
                          >
                            <Check className="ml-2 h-4 w-4 text-green-500" />
                            تسجيل حضور
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(student.id, "absent", recordId || undefined)}
                          >
                            <X className="ml-2 h-4 w-4 text-red-500" />
                            تسجيل غياب
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(student.id, "late", recordId || undefined)}
                          >
                            <Clock className="ml-2 h-4 w-4 text-yellow-500" />
                            تسجيل تأخير
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
