"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import {
  Download,
  User,
  Menu,
  Calendar,
  BookOpen,
  Users,
  QrCode,
  BarChart3,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react"
import * as XLSX from "xlsx"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { DashboardHeader } from "@/components/dashboard-header"
import { LogoutButton } from "@/components/logout-button"
import { useRouter } from "next/navigation"
import { AttendanceTable } from "@/components/attendance-table"
import { ThemeToggle } from "@/components/theme-toggle"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
// FIXME: THIS GENGRATION
// import { QRCodeGenerator } from "@/components/qr-code-generator"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import QRCodeGenerator from "@/components/qr-code-generator"
import { createClient } from "@/lib/supabase/client"


export function DoctorDashboard() {
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"))
  const [courses, setCourses] = useState<any[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()
const supabase = createClient()
  // الحصول على بيانات المستخدم الحالي
  useEffect(() => {
    async function getUserData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) return

        const { data, error } = await supabase.from("users").select("*").eq("id", user.id).single()

        if (error) throw error

        setUser(data)
      } catch (error) {
        console.error("Error fetching user:", error)
        // في حالة حدوث خطأ، قم بتسجيل الخروج
        await supabase.auth.signOut()
        router.push("/")
      } finally {
        setIsLoading(false)
      }
    }

    getUserData()
  }, [])

  // الحصول على الدورات الخاصة بالدكتور
  useEffect(() => {
    async function fetchCourses() {
      if (!user) return

      try {
        // استعلام بسيط للدورات
        const { data, error } = await supabase.from("courses").select("id, name").eq("doctor_id", user.id)

        if (error) throw error

        setCourses(data || [])

        // تحديد الدورة الافتراضية إذا كانت متوفرة
        if (data && data.length > 0 && !selectedCourseId) {
          setSelectedCourseId(data[0].id)
        }
      } catch (error: any) {
        console.error("Error fetching courses:", error)
        toast({
          variant: "destructive",
          title: "خطأ في جلب الدورات",
          description: "حدث خطأ أثناء جلب الدورات، يرجى المحاولة مرة أخرى",
        })
      }
    }

    if (user) {
      fetchCourses()
    }
  }, [user, selectedCourseId])

  // الحصول على سجلات الحضور للدورة المحددة
  useEffect(() => {
    async function fetchAttendanceRecords() {
      if (!selectedCourseId) return

      try {
        // استعلام بسيط لسجلات الحضور
        const { data, error } = await supabase
          .from("attendance")
          .select("id, student_id, course_id, date, status, created_at, session_id")
          .eq("course_id", selectedCourseId)
          .order("date", { ascending: false })

        if (error) throw error

        setAttendanceRecords(data || [])
      } catch (error: any) {
        console.error("Error fetching attendance records:", error)
        toast({
          variant: "destructive",
          title: "خطأ في جلب سجلات الحضور",
          description: "حدث خطأ أثناء جلب سجلات الحضور، يرجى المحاولة مرة أخرى",
        })
      }
    }

    if (selectedCourseId) {
      fetchAttendanceRecords()
    }
  }, [selectedCourseId])

  // الحصول على قائمة الطلاب في الدورة المحددة
  useEffect(() => {
    async function fetchStudents() {
      if (!selectedCourseId) return

      try {
        // استعلام للحصول على معرفات الطلاب في الدورة
        const { data: courseStudentsData, error: courseStudentsError } = await supabase
          .from("course_students")
          .select("student_id")
          .eq("course_id", selectedCourseId)

        if (courseStudentsError) throw courseStudentsError

        if (!courseStudentsData || courseStudentsData.length === 0) {
          setStudents([])
          return
        }

        // استخراج معرفات الطلاب
        const studentIds = courseStudentsData.map((item) => item.student_id)

        // استعلام للحصول على بيانات الطلاب
        const { data: studentsData, error: studentsError } = await supabase
          .from("users")
          .select("id, name, email")
          .in("id", studentIds)
          .eq("role", "student")

        if (studentsError) throw studentsError

        setStudents(studentsData || [])
      } catch (error: any) {
        console.error("Error fetching students:", error)
        toast({
          variant: "destructive",
          title: "خطأ في جلب الطلاب",
          description: "حدث خطأ أثناء جلب قائمة الطلاب، يرجى المحاولة مرة أخرى",
        })
      }
    }

    if (selectedCourseId) {
      fetchStudents()
    }
  }, [selectedCourseId])

  // تصدير بيانات الحضور إلى ملف Excel
  const handleExportExcel = () => {
    if (!attendanceRecords || attendanceRecords.length === 0) {
      toast({
        variant: "destructive",
        title: "لا توجد بيانات للتصدير",
        description: "يرجى التأكد من وجود سجلات حضور للدورة المحددة",
      })
      return
    }

    // تحويل البيانات إلى تنسيق مناسب للتصدير
    const exportData = attendanceRecords.map((record) => {
      // البحث عن اسم الطالب
      const student = students.find((s) => s.id === record.student_id)

      return {
        "اسم الطالب": student ? student.name : record.student_id,
        "البريد الإلكتروني": student ? student.email : "",
        التاريخ: format(new Date(record.date), "yyyy-MM-dd"),
        الحالة: record.status === "present" ? "حاضر" : record.status === "absent" ? "غائب" : "متأخر",
        "وقت التسجيل": format(new Date(record.created_at), "HH:mm:ss"),
      }
    })

    // إنشاء ملف Excel
    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "سجلات الحضور")

    // تحميل الملف
    XLSX.writeFile(workbook, `سجلات_الحضور_${selectedCourseId}_${selectedDate}.xlsx`)

    toast({
      title: "تم تصدير البيانات بنجاح",
      description: "تم تصدير سجلات الحضور إلى ملف Excel",
    })
  }

  // حساب إحصائيات الحضور للدورة المحددة
  const calculateCourseStats = () => {
    if (!attendanceRecords) return { present: 0, absent: 0, late: 0, total: 0, presentPercentage: 0 }

    const present = attendanceRecords.filter((record) => record.status === "present").length
    const absent = attendanceRecords.filter((record) => record.status === "absent").length
    const late = attendanceRecords.filter((record) => record.status === "late").length
    const total = attendanceRecords.length
    const presentPercentage = total > 0 ? Math.round((present / total) * 100) : 0

    return { present, absent, late, total, presentPercentage }
  }

  // حساب إحصائيات الحضور لكل طالب
  const calculateStudentStats = (studentId: string) => {
    const studentRecords = attendanceRecords.filter((record) => record.student_id === studentId)
    const present = studentRecords.filter((record) => record.status === "present").length
    const absent = studentRecords.filter((record) => record.status === "absent").length
    const late = studentRecords.filter((record) => record.status === "late").length
    const total = studentRecords.length
    const presentPercentage = total > 0 ? Math.round((present / total) * 100) : 0

    return { present, absent, late, total, presentPercentage }
  }

  // الحصول على الحرف الأول من اسم المستخدم
  const getInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : "U"
  }

  // تصفية الطلاب حسب البحث
  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const stats = calculateCourseStats()

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* الشريط العلوي */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">القائمة</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[240px] sm:w-[300px]">
                <nav className="flex flex-col gap-4 mt-8">
                  <Button
                    variant={activeTab === "dashboard" ? "default" : "ghost"}
                    className="justify-start"
                    onClick={() => setActiveTab("dashboard")}
                  >
                    <BarChart3 className="ml-2 h-5 w-5" />
                    لوحة التحكم
                  </Button>
                  <Button
                    variant={activeTab === "courses" ? "default" : "ghost"}
                    className="justify-start"
                    onClick={() => setActiveTab("courses")}
                  >
                    <BookOpen className="ml-2 h-5 w-5" />
                    الدورات
                  </Button>
                  <Button
                    variant={activeTab === "students" ? "default" : "ghost"}
                    className="justify-start"
                    onClick={() => setActiveTab("students")}
                  >
                    <Users className="ml-2 h-5 w-5" />
                    الطلاب
                  </Button>
                  <Button
                    variant={activeTab === "attendance" ? "default" : "ghost"}
                    className="justify-start"
                    onClick={() => setActiveTab("attendance")}
                  >
                    <Calendar className="ml-2 h-5 w-5" />
                    سجل الحضور
                  </Button>
                  <Button
                    variant={activeTab === "qr-generator" ? "default" : "ghost"}
                    className="justify-start"
                    onClick={() => setActiveTab("qr-generator")}
                  >
                    <QrCode className="ml-2 h-5 w-5" />
                    إنشاء QR
                  </Button>
                  <Separator />
                  <LogoutButton variant="ghost" size="sm" />
                </nav>
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2 font-bold text-xl">
              <img src="/placeholder.svg?height=32&width=32" alt="شعار" className="h-8 w-8" />
              <span className="hidden md:inline-block">نظام حضور معهد راية</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant={activeTab === "dashboard" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("dashboard")}
              >
                <BarChart3 className="ml-2 h-4 w-4" />
                لوحة التحكم
              </Button>
              <Button
                variant={activeTab === "courses" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("courses")}
              >
                <BookOpen className="ml-2 h-4 w-4" />
                الدورات
              </Button>
              <Button
                variant={activeTab === "students" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("students")}
              >
                <Users className="ml-2 h-4 w-4" />
                الطلاب
              </Button>
              <Button
                variant={activeTab === "attendance" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("attendance")}
              >
                <Calendar className="ml-2 h-4 w-4" />
                سجل الحضور
              </Button>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar>
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} alt={user.name} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setActiveTab("profile")}>
                  <User className="ml-2 h-4 w-4" />
                  الملف الشخصي
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("qr-generator")}>
                  <QrCode className="ml-2 h-4 w-4" />
                  إنشاء QR
                </DropdownMenuItem>
                <LogoutButton variant="ghost" size="sm"  />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <main className="flex-1 container py-8">
        {activeTab === "dashboard" && (
          <>
            <DashboardHeader heading={`مرحباً، ${user.name}`} text="إليك ملخص الحضور في دوراتك">
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <QrCode className="ml-2 h-4 w-4" />
                    إنشاء رمز QR
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>إنشاء رمز QR</DialogTitle>
                    <DialogDescription>قم بإنشاء رمز QR للطلاب لتسجيل حضورهم</DialogDescription>
                  </DialogHeader>
                  <QRCodeGenerator courses={courses} />
                </DialogContent>
              </Dialog>
            </DashboardHeader>

            <div className="flex flex-col sm:flex-row gap-4 mt-6 mb-6">
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="اختر الدورة" />
                </SelectTrigger>
                <SelectContent>
                  {courses?.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={handleExportExcel}
                disabled={!attendanceRecords || attendanceRecords.length === 0}
              >
                <Download className="ml-2 h-4 w-4" />
                تصدير إلى إكسل
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="hover-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي الطلاب</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{students?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">في الدورة المحددة</p>
                </CardContent>
              </Card>
              <Card className="hover-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">نسبة الحضور</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.presentPercentage}%</div>
                  <Progress value={stats.presentPercentage} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-2">في الدورة المحددة</p>
                </CardContent>
              </Card>
              <Card className="hover-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">الدورات</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{courses?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">الدورات التي تقوم بتدريسها</p>
                </CardContent>
              </Card>
              <Card className="hover-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">التاريخ الحالي</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{format(new Date(), "yyyy/MM/dd", { locale: ar })}</div>
                  <p className="text-xs text-muted-foreground">{format(new Date(), "EEEE", { locale: ar })}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 mt-8">
              <Card className="hover-card">
                <CardHeader>
                  <CardTitle>إحصائيات الحضور</CardTitle>
                  <CardDescription>إحصائيات الحضور للدورة المحددة</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-muted/50 p-4 rounded-lg text-center">
                        <p className="text-3xl font-bold text-success">{stats.present}</p>
                        <p className="text-sm text-muted-foreground">حضور</p>
                      </div>
                      <div className="bg-muted/50 p-4 rounded-lg text-center">
                        <p className="text-3xl font-bold text-destructive">{stats.absent}</p>
                        <p className="text-sm text-muted-foreground">غياب</p>
                      </div>
                      <div className="bg-muted/50 p-4 rounded-lg text-center">
                        <p className="text-3xl font-bold text-warning">{stats.late}</p>
                        <p className="text-sm text-muted-foreground">تأخير</p>
                      </div>
                    </div>
                    <div className="pt-4">
                      <h3 className="text-sm font-medium mb-2">النسبة الإجمالية للحضور</h3>
                      <div className="flex items-center gap-4">
                        <Progress value={stats.presentPercentage} className="flex-1" />
                        <span className="text-lg font-bold">{stats.presentPercentage}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveTab("attendance")}>
                    <Calendar className="ml-2 h-4 w-4" />
                    عرض سجلات الحضور
                  </Button>
                </CardFooter>
              </Card>

              <Card className="hover-card">
                <CardHeader>
                  <CardTitle>الطلاب الأكثر حضوراً</CardTitle>
                  <CardDescription>أعلى 5 طلاب من حيث نسبة الحضور</CardDescription>
                </CardHeader>
                <CardContent>
                  {students.length > 0 ? (
                    <div className="space-y-4">
                      {students
                        .map((student) => ({
                          ...student,
                          stats: calculateStudentStats(student.id),
                        }))
                        .sort((a, b) => b.stats.presentPercentage - a.stats.presentPercentage)
                        .slice(0, 5)
                        .map((student) => (
                          <div key={student.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${student.name}`}
                                  alt={student.name}
                                />
                                <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{student.name}</p>
                                <p className="text-xs text-muted-foreground">{student.email}</p>
                              </div>
                            </div>
                            <Badge variant="outline">{student.stats.presentPercentage}%</Badge>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="flex justify-center p-4">لا يوجد طلاب في هذه الدورة</div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveTab("students")}>
                    <Users className="ml-2 h-4 w-4" />
                    عرض جميع الطلاب
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <Card className="mt-8 hover-card">
              <CardHeader>
                <CardTitle>آخر سجلات الحضور</CardTitle>
                <CardDescription>آخر 5 سجلات حضور في الدورة المحددة</CardDescription>
              </CardHeader>
              <CardContent>
                {attendanceRecords && attendanceRecords.length > 0 ? (
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50 text-right">
                          <th className="p-2 font-medium">التاريخ</th>
                          <th className="p-2 font-medium">الطالب</th>
                          <th className="p-2 font-medium">الحالة</th>
                          <th className="p-2 font-medium">وقت التسجيل</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceRecords.slice(0, 5).map((record) => {
                          const student = students.find((s) => s.id === record.student_id)
                          return (
                            <tr key={record.id} className="border-b">
                              <td className="p-2">{format(new Date(record.date), "yyyy/MM/dd", { locale: ar })}</td>
                              <td className="p-2">{student ? student.name : "غير معروف"}</td>
                              <td className="p-2">
                                <Badge
                                  className={`${
                                    record.status === "present"
                                      ? "bg-green-100 text-green-800 hover:bg-green-100"
                                      : record.status === "absent"
                                        ? "bg-red-100 text-red-800 hover:bg-red-100"
                                        : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                  }`}
                                >
                                  {record.status === "present" ? "حاضر" : record.status === "absent" ? "غائب" : "متأخر"}
                                </Badge>
                              </td>
                              <td className="p-2">{format(new Date(record.created_at), "HH:mm:ss", { locale: ar })}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex justify-center p-4">لا توجد سجلات حضور</div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === "courses" && (
          <>
            <DashboardHeader heading="الدورات" text="إدارة الدورات التي تقوم بتدريسها">
              <Button>
                <Plus className="ml-2 h-4 w-4" />
                إضافة دورة جديدة
              </Button>
            </DashboardHeader>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
              {courses.length > 0 ? (
                courses.map((course) => {
                  // حساب عدد الطلاب في الدورة
                  const courseStudents = students.filter((s) => {
                    const studentAttendance = attendanceRecords.filter(
                      (r) => r.student_id === s.id && r.course_id === course.id,
                    )
                    return studentAttendance.length > 0
                  })

                  // حساب إحصائيات الحضور للدورة
                  const courseAttendance = attendanceRecords.filter((r) => r.course_id === course.id)
                  const present = courseAttendance.filter((r) => r.status === "present").length
                  const absent = courseAttendance.filter((r) => r.status === "absent").length
                  const late = courseAttendance.filter((r) => r.status === "late").length
                  const total = courseAttendance.length
                  const presentPercentage = total > 0 ? Math.round((present / total) * 100) : 0

                  return (
                    <Card key={course.id} className="overflow-hidden hover-card">
                      <div className="h-32 gradient-bg flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-primary/70" />
                      </div>
                      <CardHeader>
                        <CardTitle>{course.name}</CardTitle>
                        <CardDescription>{courseStudents.length} طالب مسجل</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">نسبة الحضور</span>
                              <span className="text-sm font-medium">{presentPercentage}%</span>
                            </div>
                            <Progress value={presentPercentage} />
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-muted/50 p-2 rounded-md">
                              <p className="text-xs text-muted-foreground">حضور</p>
                              <p className="font-bold">{present}</p>
                            </div>
                            <div className="bg-muted/50 p-2 rounded-md">
                              <p className="text-xs text-muted-foreground">غياب</p>
                              <p className="font-bold">{absent}</p>
                            </div>
                            <div className="bg-muted/50 p-2 rounded-md">
                              <p className="text-xs text-muted-foreground">تأخير</p>
                              <p className="font-bold">{late}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex flex-col gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setSelectedCourseId(course.id)
                            setActiveTab("attendance")
                          }}
                        >
                          <Calendar className="ml-2 h-4 w-4" />
                          سجلات الحضور
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setSelectedCourseId(course.id)
                            setActiveTab("students")
                          }}
                        >
                          <Users className="ml-2 h-4 w-4" />
                          قائمة الطلاب
                        </Button>
                      </CardFooter>
                    </Card>
                  )
                })
              ) : (
                <div className="col-span-full flex justify-center p-8 bg-muted/50 rounded-lg">
                  <p>لا توجد دورات مسجلة حالياً</p>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "students" && (
          <>
            <DashboardHeader heading="الطلاب" text="إدارة الطلاب في الدورات">
              <Button>
                <Plus className="ml-2 h-4 w-4" />
                إضافة طالب جديد
              </Button>
            </DashboardHeader>

            <div className="flex flex-col sm:flex-row gap-4 mt-6 mb-6">
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId} >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الدورة" />
                </SelectTrigger>
                <SelectContent>
                  {courses?.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="بحث عن طالب..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-3 pr-9"
                />
              </div>
            </div>

            <Card className="hover-card">
              <CardHeader>
                <CardTitle>قائمة الطلاب</CardTitle>
                <CardDescription>{filteredStudents.length} طالب في الدورة المحددة</CardDescription>
              </CardHeader>
              <CardContent>
                {filteredStudents.length > 0 ? (
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50 text-right">
                          <th className="p-2 font-medium">الاسم</th>
                          <th className="p-2 font-medium">البريد الإلكتروني</th>
                          <th className="p-2 font-medium">نسبة الحضور</th>
                          <th className="p-2 font-medium">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map((student) => {
                          const stats = calculateStudentStats(student.id)
                          return (
                            <tr key={student.id} className="border-b">
                              <td className="p-2">
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
                              </td>
                              <td className="p-2">{student.email}</td>
                              <td className="p-2">
                                <div className="flex items-center gap-2">
                                  <Progress value={stats.presentPercentage} className="w-24" />
                                  <span>{stats.presentPercentage}%</span>
                                </div>
                              </td>
                              <td className="p-2">
                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm">
                                    <Calendar className="ml-2 h-4 w-4" />
                                    سجل الحضور
                                  </Button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <Filter className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem>
                                        <CheckCircle className="ml-2 h-4 w-4 text-success" />
                                        تسجيل حضور
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        <XCircle className="ml-2 h-4 w-4 text-destructive" />
                                        تسجيل غياب
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        <AlertCircle className="ml-2 h-4 w-4 text-warning" />
                                        تسجيل تأخير
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex justify-center p-4">لا يوجد طلاب في هذه الدورة</div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === "attendance" && (
          <>
            <DashboardHeader heading="سجل الحضور" text="إدارة سجلات الحضور للطلاب">
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <QrCode className="ml-2 h-4 w-4" />
                    إنشاء رمز QR
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>إنشاء رمز QR</DialogTitle>
                    <DialogDescription>قم بإنشاء رمز QR للطلاب لتسجيل حضورهم</DialogDescription>
                  </DialogHeader>
                  <QRCodeGenerator courses={courses} />
                </DialogContent>
              </Dialog>
            </DashboardHeader>

            <div className="flex flex-col sm:flex-row gap-4 mt-6 mb-6">
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="اختر الدورة" />
                </SelectTrigger>
                <SelectContent>
                  {courses?.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <Button
                variant="outline"
                onClick={handleExportExcel}
                disabled={!attendanceRecords || attendanceRecords.length === 0}
              >
                <Download className="ml-2 h-4 w-4" />
                تصدير إلى إكسل
              </Button>
            </div>

            <Tabs defaultValue="attendance" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="attendance">سجلات الحضور</TabsTrigger>
                <TabsTrigger value="students">قائمة الطلاب</TabsTrigger>
              </TabsList>
              <TabsContent value="attendance">
                <AttendanceTable
                  attendanceRecords={attendanceRecords || []}
                  students={students || []}
                  courseId={selectedCourseId}
                  date={selectedDate}
                />
              </TabsContent>
              <TabsContent value="students">
                {students && students.length > 0 ? (
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50 text-right">
                          <th className="p-2 font-medium">الاسم</th>
                          <th className="p-2 font-medium">البريد الإلكتروني</th>
                          <th className="p-2 font-medium">نسبة الحضور</th>
                          <th className="p-2 font-medium">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student) => {
                          const stats = calculateStudentStats(student.id)
                          return (
                            <tr key={student.id} className="border-b">
                              <td className="p-2">{student.name}</td>
                              <td className="p-2">{student.email}</td>
                              <td className="p-2">
                                <div className="flex items-center gap-2">
                                  <Progress value={stats.presentPercentage} className="w-24" />
                                  <span>{stats.presentPercentage}%</span>
                                </div>
                              </td>
                              <td className="p-2">
                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm">
                                    <Calendar className="ml-2 h-4 w-4" />
                                    سجل الحضور
                                  </Button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <Filter className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem>
                                        <CheckCircle className="ml-2 h-4 w-4 text-success" />
                                        تسجيل حضور
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        <XCircle className="ml-2 h-4 w-4 text-destructive" />
                                        تسجيل غياب
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        <AlertCircle className="ml-2 h-4 w-4 text-warning" />
                                        تسجيل تأخير
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex justify-center p-4">لا يوجد طلاب في هذه الدورة</div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}

        {activeTab === "qr-generator" && (
          <>
            <DashboardHeader heading="إنشاء رمز QR" text="إنشاء رمز QR لتسجيل حضور الطلاب" />
            <div className="mt-6 max-w-md mx-auto">
              <QRCodeGenerator courses={courses} />
            </div>
          </>
        )}

        {activeTab === "profile" && (
          <>
            <DashboardHeader heading="الملف الشخصي" text="عرض وتعديل بياناتك الشخصية" />

            <div className="grid gap-6 md:grid-cols-2 mt-6">
              <Card className="hover-card">
                <CardHeader>
                  <CardTitle>المعلومات الشخصية</CardTitle>
                  <CardDescription>عرض وتعديل معلوماتك الشخصية</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center mb-6">
                    <Avatar className="h-24 w-24 mb-4">
                      <AvatarImage
                        src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                        alt={user.name}
                      />
                      <AvatarFallback className="text-2xl">{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <h2 className="text-xl font-bold">{user.name}</h2>
                    <p className="text-muted-foreground">{user.email}</p>
                    <Badge className="mt-2">{user.role === "student" ? "طالب" : "دكتور"}</Badge>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="font-medium">الاسم:</span>
                      <span>{user.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">البريد الإلكتروني:</span>
                      <span>{user.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">نوع المستخدم:</span>
                      <span>{user.role === "student" ? "طالب" : "دكتور"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">تاريخ الانضمام:</span>
                      <span>{format(new Date(user.created_at || new Date()), "yyyy/MM/dd", { locale: ar })}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full">
                    تعديل المعلومات الشخصية
                  </Button>
                </CardFooter>
              </Card>

              <Card className="hover-card">
                <CardHeader>
                  <CardTitle>إحصائيات الحساب</CardTitle>
                  <CardDescription>إحصائيات حسابك</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h3 className="font-medium mb-2">الدورات</h3>
                      <div className="flex justify-between items-center">
                        <span className="text-3xl font-bold">{courses.length}</span>
                        <BookOpen className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h3 className="font-medium mb-2">إجمالي الطلاب</h3>
                      <div className="flex justify-between items-center">
                        <span className="text-3xl font-bold">{students.length}</span>
                        <Users className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h3 className="font-medium mb-2">سجلات الحضور</h3>
                      <div className="flex justify-between items-center">
                        <span className="text-3xl font-bold">{attendanceRecords.length}</span>
                        <Calendar className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>

      {/* تذييل الصفحة */}
      <footer className="border-t py-6">
        <div className="container flex flex-col items-center justify-center gap-4 md:flex-row md:gap-8">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} معهد راية. جميع الحقوق محفوظة.
          </p>
        </div>
      </footer>
    </div>
  )
}
