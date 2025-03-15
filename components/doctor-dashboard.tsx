"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Users, BookOpen, ClipboardList, User, Menu, FileText, BarChart3 } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardShell } from "@/components/dashboard-shell"
import { QRCodeGenerator } from "@/components/qr-code-generator"
import { AddCourseDialog } from "@/components/dialogs/add-course-dialog"
import { AddStudentDialog } from "@/components/dialogs/add-student-dialog"
import { CourseDetailsDialog } from "@/components/dialogs/course-details-dialog"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { AttendanceTable } from "@/components/attendance-table"
import { ProfileSection } from "@/components/profile-section"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { Separator } from "@/components/ui/separator"

import { DashboardHeader } from "@/components/dashboard-header"
import { LogoutButton } from "@/components/logout-button"
import { Progress } from "@/components/ui/progress"


export function DoctorDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [courses, setCourses] = useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [students, setStudents] = useState<any[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([])
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false)
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false)
  const [isCourseDetailsOpen, setIsCourseDetailsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("dashboard")

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser()
        if (authError) throw authError

        if (!authUser) {
          router.push("/login")
          return
        }

        // Get user details from the users table
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .single()

        if (userError) throw userError

        if (userData.role !== "doctor") {
          router.push("/")
          return
        }

        setUser(userData)
        fetchCourses(userData.id)
      } catch (error: any) {
        console.error("Error fetching user:", error)
        toast({
          variant: "destructive",
          title: "خطأ في تحميل البيانات",
          description: "حدث خطأ أثناء تحميل بيانات المستخدم",
        })
        router.push("/login")
      }
    }

    fetchUser()
  }, [])

  // Fetch courses for the doctor
  const fetchCourses = async (doctorId: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("doctor_id", doctorId)
        .order("created_at", { ascending: false })

      if (error) throw error

      setCourses(data || [])
      if (data && data.length > 0) {
        setSelectedCourse(data[0].id)
        fetchStudentsForCourse(data[0].id)
        fetchAttendanceForCourse(data[0].id)
      }
    } catch (error: any) {
      console.error("Error fetching courses:", error)
      toast({
        variant: "destructive",
        title: "خطأ في تحميل الدورات",
        description: "حدث خطأ أثناء تحميل قائمة الدورات",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch students for a course
  const fetchStudentsForCourse = async (courseId: string) => {
    try {
      const { data, error } = await supabase
        .from("course_students")
        .select(`
          id,
          student:student_id(
            id,
            name,
            email
          )
        `)
        .eq("course_id", courseId)

      if (error) throw error

      // Transform the data to a more usable format
      const formattedStudents = data.map((item: any) => ({
        id: item.student.id,
        name: item.student.name,
        email: item.student.email,
      }))

      setStudents(formattedStudents)
    } catch (error: any) {
      console.error("Error fetching students:", error)
      toast({
        variant: "destructive",
        title: "خطأ في تحميل الطلاب",
        description: "حدث خطأ أثناء تحميل قائمة الطلاب",
      })
    }
  }

  // Fetch attendance records for a course
  const fetchAttendanceForCourse = async (courseId: string) => {
    try {
      const { data, error } = await supabase
        .from("attendance")
        .select(`
          id,
          date,
          status,
          student:student_id(
            id,
            name,
            email
          )
        `)
        .eq("course_id", courseId)
        .order("date", { ascending: false })

      if (error) throw error

      setAttendanceRecords(data || [])
    } catch (error: any) {
      console.error("Error fetching attendance:", error)
      toast({
        variant: "destructive",
        title: "خطأ في تحميل سجلات الحضور",
        description: "حدث خطأ أثناء تحميل سجلات الحضور",
      })
    }
  }

  // Handle course selection
  const handleCourseSelect = (courseId: string) => {
    setSelectedCourse(courseId)
    fetchStudentsForCourse(courseId)
    fetchAttendanceForCourse(courseId)
  }

  // Handle course refresh after adding a new course
  const handleCourseAdded = () => {
    if (user) {
      fetchCourses(user.id)
    }
  }

  // Handle student refresh after adding new students
  const handleStudentsAdded = () => {
    if (selectedCourse) {
      fetchStudentsForCourse(selectedCourse)
    }
  }

  const refreshUserData = async () => {
    const { data: userData, error: userError } = await supabase.from("users").select("*").eq("id", user.id).single()

    if (userError) {
      toast({
        variant: "destructive",
        title: "Error refreshing user data",
        description: "Failed to update user information.",
      })
      return
    }

    setUser(userData)
  }

  const calculateCourseStats = (courseId: string) => {
    const total = attendanceRecords.filter((record) => record.course_id === courseId).length
    const present = attendanceRecords.filter(
      (record) => record.course_id === courseId && record.status === "present",
    ).length
    const absent = attendanceRecords.filter(
      (record) => record.course_id === courseId && record.status === "absent",
    ).length
    const late = attendanceRecords.filter((record) => record.course_id === courseId && record.status === "late").length

    const presentPercentage = total > 0 ? Math.round((present / total) * 100) : 0

    return {
      total,
      present,
      absent,
      late,
      presentPercentage,
    }
  }

  const calculateStudentStats = (studentId: string) => {
    const total = attendanceRecords.filter((record) => record.student.id === studentId).length
    const present = attendanceRecords.filter(
      (record) => record.student.id === studentId && record.status === "present",
    ).length

    const presentPercentage = total > 0 ? Math.round((present / total) * 100) : 0

    return {
      total,
      present,
      presentPercentage,
    }
  }

  const calculateOverallStats = () => {
    const totalCourses = courses.length
    const totalStudents = students.length
    const totalLectures = attendanceRecords.length

    return {
      totalCourses,
      totalStudents,
      totalLectures,
    }
  }

  return (
    <DashboardShell>
      {/* Add header with profile navigation */}
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
                    variant={activeTab === "profile" ? "default" : "ghost"}
                    className="justify-start"
                    onClick={() => setActiveTab("profile")}
                  >
                    <User className="ml-2 h-5 w-5" />
                    الملف الشخصي
                  </Button>
                  <Button
                    variant={activeTab === "reports" ? "default" : "ghost"}
                    className="justify-start"
                    onClick={() => setActiveTab("reports")}
                  >
                    <FileText className="ml-2 h-5 w-5" />
                    التقارير
                  </Button>
                  <Separator />
                  <LogoutButton variant="ghost" />
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
                variant={activeTab === "profile" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("profile")}
              >
                <User className="ml-2 h-4 w-4" />
                الملف الشخصي
              </Button>
              <Button
                variant={activeTab === "reports" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("reports")}
              >
                <FileText className="ml-2 h-4 w-4" />
                التقارير
              </Button>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar>
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`}
                      alt={user?.name}
                    />
                    <AvatarFallback>{user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setActiveTab("profile")}>
                  <User className="ml-2 h-4 w-4" />
                  الملف الشخصي
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("reports")}>
                  <FileText className="ml-2 h-4 w-4" />
                  التقارير
                </DropdownMenuItem>
                <LogoutButton variant="ghost" size="sm" />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container py-8">
        {activeTab === "dashboard" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">لوحة تحكم المحاضر</h1>
              <Button onClick={() => setIsAddCourseOpen(true)}>
                <Plus className="ml-2 h-4 w-4" />
                إضافة دورة جديدة
              </Button>
            </div>

            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="h-24 bg-muted/50" />
                    <CardContent className="h-12 bg-muted/30 mt-4" />
                    <CardFooter className="h-8 bg-muted/20 mt-2" />
                  </Card>
                ))}
              </div>
            ) : courses.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>لا توجد دورات</CardTitle>
                  <CardDescription>لم تقم بإنشاء أي دورات بعد</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>قم بإنشاء دورة جديدة للبدء في تتبع حضور الطلاب</p>
                </CardContent>
                <CardFooter>
                  <Button onClick={() => setIsAddCourseOpen(true)}>
                    <Plus className="ml-2 h-4 w-4" />
                    إنشاء دورة جديدة
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {courses.map((course) => (
                    <Card
                      key={course.id}
                      className={`cursor-pointer transition-colors ${selectedCourse === course.id ? "border-primary" : ""}`}
                      onClick={() => handleCourseSelect(course.id)}
                    >
                      <CardHeader>
                        <CardTitle>{course.name}</CardTitle>
                        <CardDescription>
                          تم الإنشاء في {new Date(course.created_at).toLocaleDateString("ar-EG")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{students.length} طالب</span>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedCourse(course.id)
                            setIsCourseDetailsOpen(true)
                          }}
                        >
                          عرض تفاصيل الدورة
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>

                {selectedCourse && (
                  <Tabs defaultValue="attendance" className="mt-6">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="attendance">
                        <ClipboardList className="ml-2 h-4 w-4" />
                        سجل الحضور
                      </TabsTrigger>
                      <TabsTrigger value="students">
                        <Users className="ml-2 h-4 w-4" />
                        الطلاب
                      </TabsTrigger>
                      <TabsTrigger value="qrcode">
                        <BookOpen className="ml-2 h-4 w-4" />
                        إنشاء رمز الحضور
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="attendance" className="mt-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>سجل الحضور</CardTitle>
                          <CardDescription>عرض سجل حضور الطلاب في الدورة</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <AttendanceTable records={attendanceRecords} />
                        </CardContent>
                      </Card>
                    </TabsContent>
                    <TabsContent value="students" className="mt-4">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                          <div>
                            <CardTitle>الطلاب المسجلين</CardTitle>
                            <CardDescription>قائمة الطلاب المسجلين في الدورة</CardDescription>
                          </div>
                          <Button onClick={() => setIsAddStudentOpen(true)}>
                            <Plus className="ml-2 h-4 w-4" />
                            إضافة طلاب
                          </Button>
                        </CardHeader>
                        <CardContent>
                          {students.length === 0 ? (
                            <p className="text-center py-4 text-muted-foreground">لا يوجد طلاب مسجلين في هذه الدورة</p>
                          ) : (
                            <div className="rounded-md border">
                              <div className="grid grid-cols-3 border-b bg-muted/50 p-2 font-medium">
                                <div>الاسم</div>
                                <div>البريد الإلكتروني</div>
                                <div>معرف الطالب</div>
                              </div>
                              <div className="divide-y">
                                {students.map((student) => (
                                  <div key={student.id} className="grid grid-cols-3 p-2">
                                    <div>{student.name}</div>
                                    <div className="text-muted-foreground">{student.email}</div>
                                    <div className="font-mono text-xs">{student.id}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                    <TabsContent value="qrcode" className="mt-4">
                      <QRCodeGenerator courses={courses} />
                    </TabsContent>
                  </Tabs>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === "profile" && (
          <>
            <DashboardHeader heading="الملف الشخصي" text="عرض وتعديل بياناتك الشخصية" />
            <ProfileSection
              user={user}
              stats={{
                coursesCount: courses.length,
                totalStudents: students.length,
                totalLectures: attendanceRecords.length,
              }}
              onUserUpdated={refreshUserData}
            />
          </>
        )}

        {activeTab === "reports" && (
          <>
            <DashboardHeader heading="التقارير" text="تقارير الحضور والغياب" />

            <div className="grid gap-6 md:grid-cols-2 mt-6">
              {/* تقرير الدورات */}
              <Card>
                <CardHeader>
                  <CardTitle>تقرير الدورات</CardTitle>
                  <CardDescription>تقرير مفصل عن جميع الدورات والطلاب</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {courses.map((course) => {
                      const courseStats = calculateCourseStats(course.id)
                      return (
                        <div key={course.id} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium">{course.name}</h4>
                            <span className="text-sm">{courseStats.total} محاضرة</span>
                          </div>
                          <Progress value={courseStats.presentPercentage} />
                          <div className="grid grid-cols-3 gap-2 text-center text-sm">
                            <div>حضور: {courseStats.present}</div>
                            <div>غياب: {courseStats.absent}</div>
                            <div>تأخير: {courseStats.late}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>

              </Card>

              {/* تقرير الطلاب */}
              <Card>
                <CardHeader>
                  <CardTitle>تقرير الطلاب</CardTitle>
                  <CardDescription>تقرير مفصل عن حضور الطلاب</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedCourse && (
                      <>
                        <h4 className="font-medium">{courses.find((c) => c.id === selectedCourse)?.name}</h4>
                        <div className="rounded-md border">
                          <div className="grid grid-cols-2 border-b bg-muted/50 p-2 font-medium">
                            <div>الطالب</div>
                            <div>نسبة الحضور</div>
                          </div>
                          <div className="divide-y">
                            {students.map((student) => {
                              const stats = calculateStudentStats(student.id)
                              return (
                                <div key={student.id} className="grid grid-cols-2 p-2">
                                  <div>{student.name}</div>
                                  <div>{stats.presentPercentage}%</div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>

              </Card>
            </div>
          </>
        )}
      </main>

      {/* Dialogs */}
      <AddCourseDialog open={isAddCourseOpen} onOpenChange={setIsAddCourseOpen} onSuccess={handleCourseAdded} />

      {selectedCourse && (
        <>
          <AddStudentDialog
            open={isAddStudentOpen}
            onOpenChange={setIsAddStudentOpen}
            courseId={selectedCourse}
            onSuccess={handleStudentsAdded}
          />
          <CourseDetailsDialog
            open={isCourseDetailsOpen}
            onOpenChange={setIsCourseDetailsOpen}
            course={courses.find((c) => c.id === selectedCourse)}
            students={students}
            attendanceStats={calculateCourseStats(selectedCourse)}
          />
        </>
      )}
    </DashboardShell>
  )
}
