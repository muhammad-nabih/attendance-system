"use client"
import LOGO from "@/public/LOGO.png"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Plus,
  Users,
  BookOpen,
  ClipboardList,
  User,
  Menu,
  FileText,
  BarChart3,
  Trash2,
  AlertCircle,
  CheckSquare,
  Square,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardShell } from "@/components/dashboard-shell"
import { QRCodeGenerator } from "@/components/qr-code-generator"
import { AddCourseDialog } from "@/components/dialogs/add-course-dialog"
import { AddStudentDialog } from "@/components/dialogs/add-student-dialog"
import { CourseDetailsDialog } from "@/components/dialogs/course-details-dialog"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
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
import { useDoctorCourses, useCourseStudents, useCourseAttendance } from "@/hooks/use-realtime-queries"
import { useCourseOperations } from "@/hooks/use-course-operations"
import { useStudentOperations } from "@/hooks/use-student-operations"
import Image from "next/image"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { useQueryClient } from "@tanstack/react-query"

export function DoctorDashboard() {
  // Add queryClient at the top of the component
  const queryClient = useQueryClient()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false)
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false)
  const [isCourseDetailsOpen, setIsCourseDetailsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [courseStatsMap, setCourseStatsMap] = useState<Record<string, any>>({})
  const [studentStatsMap, setStudentStatsMap] = useState<Record<string, any>>({})

  // Student selection state
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
  const [isDeleteStudentsDialogOpen, setIsDeleteStudentsDialogOpen] = useState(false)

  // Course operations
  const [courseToDelete, setCourseToDelete] = useState<any>(null)
  const [isDeleteCourseDialogOpen, setIsDeleteCourseDialogOpen] = useState(false)
  const [courseToEdit, setCourseToEdit] = useState<any>(null)
  const [isEditCourseDialogOpen, setIsEditCourseDialogOpen] = useState(false)
  const [newCourseName, setNewCourseName] = useState("")
  const [isDeleteAllCoursesDialogOpen, setIsDeleteAllCoursesDialogOpen] = useState(false)
  const [isDeleteAllStudentsDialogOpen, setIsDeleteAllStudentsDialogOpen] = useState(false)

  // Custom hooks for operations
  const {
    deleteCourse,
    updateCourseName,
    deleteAllCourses,
    isLoading: isCourseOperationLoading,
  } = useCourseOperations()

  const { deleteStudents, deleteAllStudents, isLoading: isStudentOperationLoading } = useStudentOperations()

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
        setIsLoading(false)
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

  // Usar los hooks de React Query
  const { courses, isLoading: isLoadingCourses, refetch: refetchCourses } = useDoctorCourses(user?.id)
  const { students, refetch: refetchStudents } = useCourseStudents(selectedCourse)
  const { attendanceRecords, refetch: refetchAttendance } = useCourseAttendance(selectedCourse)

// FIXME: STUDENT NUMBER SHOULD FIXED
  console.log(courses)
  console.log(students)
  // Establecer el curso seleccionado por defecto
  useEffect(() => {
    if (courses.length > 0 && !selectedCourse) {
      setSelectedCourse(courses[0].id)
    }
  }, [courses, selectedCourse])

  // Handle course selection
  const handleCourseSelect = (courseId: string) => {
    setSelectedCourse(courseId)
    // Reset student selection when changing courses
    setSelectedStudents([])
    setIsMultiSelectMode(false)
  }

  // Handle course refresh after adding a new course
  const handleCourseAdded = () => {
    refetchCourses()
  }

  // Handle student refresh after adding new students
  const handleStudentsAdded = () => {
    refetchStudents()
  }

  // Toggle student selection for multi-select mode
  const toggleStudentSelection = (studentId: string) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter((id) => id !== studentId))
    } else {
      setSelectedStudents([...selectedStudents, studentId])
    }
  }

  // Toggle multi-select mode
  const toggleMultiSelectMode = () => {
    setIsMultiSelectMode(!isMultiSelectMode)
    if (isMultiSelectMode) {
      // Clear selections when exiting multi-select mode
      setSelectedStudents([])
    }
  }

  // Handle deleting selected students
  const handleDeleteSelectedStudents = async () => {
    if (selectedStudents.length === 0 || !selectedCourse) return

    const success = await deleteStudents(selectedStudents, selectedCourse)

    if (success) {
      // Reset selection state
      setSelectedStudents([])
      setIsMultiSelectMode(false)
      setIsDeleteStudentsDialogOpen(false)
    }
  }

  // Handle deleting all students from a course
  const handleDeleteAllStudents = async () => {
    if (!selectedCourse) return

    const success = await deleteAllStudents(selectedCourse)

    if (success) {
      setIsDeleteAllStudentsDialogOpen(false)
    }
  }

  // Handle course deletion
  const handleDeleteCourse = async () => {
    if (!courseToDelete) return

    const success = await deleteCourse(courseToDelete.id)

    if (success) {
      // Reset selected course if it was deleted
      if (selectedCourse === courseToDelete.id) {
        setSelectedCourse(null)
      }
      setCourseToDelete(null)
      setIsDeleteCourseDialogOpen(false)
    }
  }

  // Handle course name update
  const handleEditCourseName = async () => {
    if (!courseToEdit || !newCourseName.trim()) return

    const success = await updateCourseName(courseToEdit.id, newCourseName)

    if (success) {
      setCourseToEdit(null)
      setNewCourseName("")
      setIsEditCourseDialogOpen(false)
    }
  }

  // Handle deleting all courses
  const handleDeleteAllCourses = async () => {
    if (!user?.id) return

    const success = await deleteAllCourses(user.id)

    if (success) {
      setSelectedCourse(null)
      setIsDeleteAllCoursesDialogOpen(false)
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

  // Function to get sessions for a course
  const getCourseSessions = async (courseId: string) => {
    try {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("course_id", courseId)
        .order("session_number", { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching sessions:", error)
      return []
    }
  }

  // Calculate course statistics with accurate session count
  const calculateCourseStats = async (courseId: string) => {
    // Get all sessions for this course to get accurate count
    const sessions = await getCourseSessions(courseId)
    const totalSessions = sessions.length

    // Filter attendance records for this course
    const courseAttendance = attendanceRecords.filter((record: any) => record.course_id === courseId)

    // Count by status
    const present = courseAttendance.filter((record: any) => record.status === "present").length
    const absent = courseAttendance.filter((record: any) => record.status === "absent").length
    const late = courseAttendance.filter((record: any) => record.status === "late").length

    // Calculate percentage based on total sessions and enrolled students
    const totalPossibleAttendances = totalSessions * students.length
    const presentPercentage = totalPossibleAttendances > 0 ? Math.round((present / totalPossibleAttendances) * 100) : 0

    return {
      totalSessions,
      present,
      absent,
      late,
      presentPercentage,
    }
  }

  // Calculate student attendance statistics
  const calculateStudentStats = async (studentId: string, courseId: string) => {
    // Get all sessions for this course
    const sessions = await getCourseSessions(courseId)
    const totalSessions = sessions.length

    // Get attendance records for this student in this course
    const studentAttendance = attendanceRecords.filter(
      (record: any) => record.student_id === studentId && record.course_id === courseId,
    )

    // Count present records
    const present = studentAttendance.filter((record: any) => record.status === "present").length

    // Calculate percentage
    const presentPercentage = totalSessions > 0 ? Math.round((present / totalSessions) * 100) : 0

    return {
      totalSessions,
      present,
      presentPercentage,
    }
  }

  // تحديث وظيفة تحديث حالة الحضور
  const updateAttendanceStatus = async (sessionId: string) => {
    try {
      // Get the session details
      const { data: sessionData, error: sessionError } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", sessionId)
        .single()

      if (sessionError) throw sessionError

      // Get all students in the course
      const { data: courseStudents, error: studentsError } = await supabase
        .from("course_students")
        .select("student_id")
        .eq("course_id", sessionData.course_id)

      if (studentsError) throw studentsError

      // Get existing attendance records for this session
      const { data: existingAttendance, error: attendanceError } = await supabase
        .from("attendance")
        .select("*")
        .eq("session_id", sessionId)

      if (attendanceError) throw attendanceError

      // Create a map of student IDs to their attendance status
      const attendanceMap = new Map()
      existingAttendance.forEach((record: any) => {
        attendanceMap.set(record.student_id, {
          id: record.id,
          status: record.status,
          created_at: record.created_at,
        })
      })

      // Get the session creation time
      const sessionTime = new Date(sessionData.created_at).getTime()
      const currentTime = new Date().getTime()

      // Calculate time thresholds (30 minutes and 2 hours in milliseconds)
      const lateThreshold = 30 * 60 * 1000 // 30 minutes
      const absentThreshold = 2 * 60 * 60 * 1000 // 2 hours

      // Update attendance status for all students
      for (const { student_id } of courseStudents) {
        // If student already has an attendance record
        if (attendanceMap.has(student_id)) {
          const record = attendanceMap.get(student_id)
          const recordTime = new Date(record.created_at).getTime()
          const timeDifference = recordTime - sessionTime

          // Update status based on time difference
          let newStatus = record.status
          if (timeDifference > absentThreshold) {
            newStatus = "absent"
          } else if (timeDifference > lateThreshold) {
            newStatus = "late"
          }

          // Update if status changed
          if (newStatus !== record.status) {
            await supabase.from("attendance").update({ status: newStatus }).eq("id", record.id)
          }
        } else {
          // If student doesn't have an attendance record, mark as absent
          // Only create absent records if the session is older than the absent threshold
          if (currentTime - sessionTime > absentThreshold) {
            await supabase.from("attendance").insert({
              student_id,
              course_id: sessionData.course_id,
              date: sessionData.date,
              status: "absent",
              session_id: sessionId,
            })
          }
        }
      }

      // Refresh attendance data
      refetchAttendance()

      toast({
        title: "تم تحديث حالة الحضور",
        description: "تم تحديث حالة الحضور لجميع الطلاب بناءً على وقت التسجيل",
      })
    } catch (error: any) {
      console.error("Error updating attendance status:", error)
      toast({
        variant: "destructive",
        title: "خطأ في تحديث حالة الحضور",
        description: error.message || "حدث خطأ أثناء تحديث حالة الحضور",
      })
    }
  }

  // Function to manually mark a student as absent/present/late
  const updateStudentAttendance = async (attendanceId: string, newStatus: string) => {
    try {
      const { error } = await supabase.from("attendance").update({ status: newStatus }).eq("id", attendanceId)

      if (error) throw error

      refetchAttendance()

      toast({
        title: "تم تحديث حالة الحضور",
        description: "تم تحديث حالة حضور الطالب بنجاح",
      })
    } catch (error: any) {
      console.error("Error updating student attendance:", error)
      toast({
        variant: "destructive",
        title: "خطأ في تحديث حالة الحضور",
        description: error.message || "حدث خطأ أثناء تحديث حالة حضور الطالب",
      })
    }
  }

  useEffect(() => {
    const fetchCourseStats = async () => {
      const stats: Record<string, any> = {}
      for (const course of courses) {
        stats[course.id] = await calculateCourseStats(course.id)
      }
      setCourseStatsMap(stats)
    }

    if (courses.length > 0) {
      fetchCourseStats()
    }
  }, [courses, attendanceRecords, students])

  useEffect(() => {
    const fetchStudentStats = async () => {
      if (!selectedCourse) return

      const stats: Record<string, any> = {}
      for (const student of students) {
        stats[student.id] = await calculateStudentStats(student.id, selectedCourse)
      }
      setStudentStatsMap(stats)
    }

    if (students.length > 0 && selectedCourse) {
      fetchStudentStats()
    }
  }, [students, selectedCourse, attendanceRecords])

  if (isLoading || isLoadingCourses) {
    return (
      <DashboardShell>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardShell>
    )
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
              <Image src={LOGO || "/placeholder.svg"} alt="شعار" className="h-8 w-8" />
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
              <div className="flex gap-2">
                <Button onClick={() => setIsAddCourseOpen(true)}>
                  <Plus className="ml-2 h-4 w-4" />
                  إضافة دورة جديدة
                </Button>
                {courses.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setIsDeleteAllCoursesDialogOpen(true)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="ml-2 h-4 w-4" />
                    حذف جميع الدورات
                  </Button>
                )}
              </div>
            </div>

            {courses.length === 0 ? (
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
                      <CardHeader className="flex flex-row items-start justify-between">
                        <div>
                          <CardTitle>{course.name}</CardTitle>
                          <CardDescription className="my-5">
                            تم الإنشاء في {new Date(course.created_at).toLocaleDateString("ar-EG")}
                          </CardDescription>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="lucide lucide-more-vertical"
                              >
                                <circle cx="12" cy="12" r="1" />
                                <circle cx="12" cy="5" r="1" />
                                <circle cx="12" cy="19" r="1" />
                              </svg>
                              <span className="sr-only">خيارات</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {

                                setCourseToEdit(course)
                                setNewCourseName(course.name)
                                setIsEditCourseDialogOpen(true)
                              }}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="lucide lucide-pencil ml-2"
                              >
                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                              </svg>
                              تعديل اسم الدورة
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                setCourseToDelete(course)
                                setIsDeleteCourseDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4 ml-2" />
                              حذف الدورة
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </CardHeader>
                      <CardContent className="sr-only">

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
                        <CardHeader className="flex flex-row items-center justify-between">
                          <div>
                            <CardTitle>سجل الحضور</CardTitle>
                            <CardDescription>عرض سجل حضور الطلاب في الدورة</CardDescription>
                          </div>
                          <Button
                            variant="outline"
                            onClick={async () => {
                              // Get the latest session for this course
                              const sessions = await getCourseSessions(selectedCourse)
                              if (sessions.length > 0) {
                                updateAttendanceStatus(sessions[sessions.length - 1].id)
                              } else {
                                toast({
                                  variant: "destructive",
                                  title: "لا توجد محاضرات",
                                  description: "لا توجد محاضرات لتحديث حالة الحضور",
                                })
                              }
                            }}
                          >
                            <AlertCircle className="ml-2 h-4 w-4" />
                            تحديث حالة الحضور تلقائياً
                          </Button>
                        </CardHeader>
                        <CardContent>
                          <AttendanceTable
                            records={attendanceRecords}
                            courseId={selectedCourse}
                            onUpdateStatus={updateStudentAttendance}
                          />
                        </CardContent>
                      </Card>
                    </TabsContent>
                    <TabsContent value="students" className="mt-4">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                          <div>
                            <CardTitle>الطلاب المسجلين</CardTitle>
                            <CardDescription className="my-4">قائمة الطلاب المسجلين في الدورة</CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={() => setIsAddStudentOpen(true)}>
                              <Plus className="ml-2 h-4 w-4" />
                              إضافة طلاب
                            </Button>
                            {students.length > 0 && (
                              <>
                                <Button variant="outline" onClick={toggleMultiSelectMode}>
                                  <CheckSquare className="ml-2 h-4 w-4" />
                                  {isMultiSelectMode ? "إلغاء التحديد" : "تحديد متعدد"}
                                </Button>
                                {isMultiSelectMode && selectedStudents.length > 0 && (
                                  <Button variant="destructive" onClick={() => setIsDeleteStudentsDialogOpen(true)}>
                                    <Trash2 className="ml-2 h-4 w-4" />
                                    حذف المحدد ({selectedStudents.length})
                                  </Button>
                                )}
                                {students.length > 0 && (
                                  <Button
                                    variant="outline"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => setIsDeleteAllStudentsDialogOpen(true)}
                                  >
                                    <Trash2 className="ml-2 h-4 w-4" />
                                    حذف الكل
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          {students.length === 0 ? (
                            <p className="text-center py-4 text-muted-foreground">لا يوجد طلاب مسجلين في هذه الدورة</p>
                          ) : (
                            <div className="rounded-md border">
                              <div className="grid grid-cols-4 border-b bg-muted/50 p-2 font-medium">
                                <div className="flex items-center">
                                  {isMultiSelectMode && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="mr-2 p-0 h-6 w-6"
                                      onClick={() => {
                                        if (selectedStudents.length === students.length) {
                                          setSelectedStudents([])
                                        } else {
                                          setSelectedStudents(students.map((s) => s.id))
                                        }
                                      }}
                                    >
                                      {selectedStudents.length === students.length ? (
                                        <CheckSquare className="h-4 w-4" />
                                      ) : (
                                        <Square className="h-4 w-4" />
                                      )}
                                    </Button>
                                  )}
                                  الاسم
                                </div>
                                <div>البريد الإلكتروني</div>
                                <div>معرف الطالب</div>
                                <div>الإجراءات</div>
                              </div>
                              <div className="divide-y">
                                {students.map((student) => (
                                  <div key={student.id} className="grid grid-cols-4 p-2">
                                    <div className="flex items-center">
                                      {isMultiSelectMode && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="mr-2 p-0 h-6 w-6"
                                          onClick={() => toggleStudentSelection(student.id)}
                                        >
                                          {selectedStudents.includes(student.id) ? (
                                            <CheckSquare className="h-4 w-4" />
                                          ) : (
                                            <Square className="h-4 w-4" />
                                          )}
                                        </Button>
                                      )}
                                      {student.name}
                                    </div>
                                    <div className="text-muted-foreground">{student.email}</div>
                                    <div className="font-mono text-xs">{student.id}</div>
                                    <div>
                                      {!isMultiSelectMode && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                          onClick={() => {
                                            setSelectedStudents([student.id])
                                            setIsDeleteStudentsDialogOpen(true)
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                          <span className="sr-only">حذف الطالب</span>
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                    <TabsContent value="qrcode" className="mt-4">
                      <QRCodeGenerator
                        courses={courses}
                        userId={user.id}
                        onSessionCreated={() => {
                          // Refresh attendance data after creating a new session
                          refetchAttendance()
                        }}
                      />
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
                      const courseStats = courseStatsMap[course.id] || {
                        totalSessions: 0,
                        present: 0,
                        absent: 0,
                        late: 0,
                        presentPercentage: 0,
                      }

                      return (
                        <div key={course.id} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium">{course.name}</h4>
                            <span className="text-sm">{courseStats.totalSessions} محاضرة</span>
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
                          <div className="grid grid-cols-3 border-b bg-muted/50 p-2 font-medium">
                            <div>الطالب</div>
                            <div>نسبة الحضور</div>
                            <div>الحالة</div>
                          </div>
                          <div className="divide-y">
                            {students.map((student) => {
                              const stats = studentStatsMap[student.id] || {
                                totalSessions: 0,
                                present: 0,
                                presentPercentage: 0,
                              }

                              return (
                                <div key={student.id} className="grid grid-cols-3 p-2">
                                  <div>{student.name}</div>
                                  <div>{stats.presentPercentage}%</div>
                                  <div>
                                    <Badge
                                      variant="outline"
                                      className={
                                        stats.presentPercentage >= 75
                                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                                          : stats.presentPercentage >= 50
                                            ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                            : "bg-red-100 text-red-800 hover:bg-red-100"
                                      }
                                    >
                                      {stats.presentPercentage >= 75
                                        ? "جيد"
                                        : stats.presentPercentage >= 50
                                          ? "متوسط"
                                          : "ضعيف"}
                                    </Badge>
                                  </div>
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

          {/* Course Details Dialog */}
          <CourseDetailsDialog
            open={isCourseDetailsOpen}
            onOpenChange={setIsCourseDetailsOpen}
            course={courses.find((c) => c.id === selectedCourse)}
            students={students}
            attendanceStats={async () => await calculateCourseStats(selectedCourse)}
          />
        </>
      )}

      {/* Delete Selected Students Dialog */}
      <AlertDialog open={isDeleteStudentsDialogOpen} onOpenChange={setIsDeleteStudentsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الطلاب المحددين</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من رغبتك في حذف {selectedStudents.length} طالب من هذه الدورة؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-end gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteSelectedStudents}
              disabled={isStudentOperationLoading}
            >
              {isStudentOperationLoading ? "جاري الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Students Dialog */}
      <AlertDialog open={isDeleteAllStudentsDialogOpen} onOpenChange={setIsDeleteAllStudentsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف جميع الطلاب</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من رغبتك في حذف جميع الطلاب من هذه الدورة؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-end gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteAllStudents}
              disabled={isStudentOperationLoading}
            >
              {isStudentOperationLoading ? "جاري الحذف..." : "حذف الكل"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Course Name Dialog */}
      <AlertDialog open={isEditCourseDialogOpen} onOpenChange={setIsEditCourseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تعديل اسم الدورة</AlertDialogTitle>
            <AlertDialogDescription>أدخل الاسم الجديد للدورة</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">اسم الدورة</Label>
              <input
                id="name"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                placeholder="أدخل اسم الدورة الجديد"
              />
            </div>
          </div>
          <AlertDialogFooter className="flex justify-end gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEditCourseName}
              disabled={!newCourseName.trim() || isCourseOperationLoading}
            >
              {isCourseOperationLoading ? "جاري الحفظ..." : "حفظ التغييرات"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Course Dialog */}
      <AlertDialog open={isDeleteCourseDialogOpen} onOpenChange={setIsDeleteCourseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الدورة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من رغبتك في حذف الدورة {courseToDelete?.name}؟ سيتم حذف جميع بيانات الدورة بما في ذلك سجلات
              الحضور والطلاب المسجلين. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-end gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteCourse}
              disabled={isCourseOperationLoading}
            >
              {isCourseOperationLoading ? "جاري الحذف..." : "حذف الدورة"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Courses Dialog */}
      <AlertDialog open={isDeleteAllCoursesDialogOpen} onOpenChange={setIsDeleteAllCoursesDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف جميع الدورات</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من رغبتك في حذف جميع الدورات؟ سيتم حذف جميع البيانات المرتبطة بالدورات بما في ذلك سجلات
              الحضور والطلاب المسجلين. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-end gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteAllCourses}
              disabled={isCourseOperationLoading}
            >
              {isCourseOperationLoading ? "جاري الحذف..." : "حذف جميع الدورات"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardShell>
  )
}
