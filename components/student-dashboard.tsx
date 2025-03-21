'use client';

import LOGO from '@/public/LOGO.png';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, isSameWeek, isToday, isYesterday, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle,
  FileText,
  Menu,
  QrCode,
  User,
  XCircle,
} from 'lucide-react';

import { useState } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { DashboardHeader } from '@/components/dashboard-header';
import { CourseDetailsDialog } from '@/components/dialogs/course-details-dialog';
import { LogoutButton } from '@/components/logout-button';
import { ProfileSection } from '@/components/profile-section';
import { QRCodeScanner } from '@/components/qr-code-scanner';
import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';

import { createClient } from '@/lib/supabase/client';

import { useStudentAttendance, useStudentCourses } from '@/hooks/use-realtime-queries';

export function StudentDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [courseDetailsOpen, setCourseDetailsOpen] = useState(false);
  const [selectedCourseForDetails, setSelectedCourseForDetails] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Consulta para obtener los datos del usuario
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;

      if (!authUser) {
        router.push('/login');
        return null;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (userError) throw userError;

      if (userData.role !== 'student') {
        router.push('/');
        return null;
      }

      return userData;
    },
  });

  // Usar los hooks de React Query para cursos y asistencia
  const { courses } = useStudentCourses(user?.id);
  const { attendanceRecords } = useStudentAttendance(user?.id);

  // Categorizar los registros de asistencia por tiempo
  const categorizeAttendance = () => {
    if (!attendanceRecords) return { today: [], yesterday: [], thisWeek: [], older: [] };

    const today = [];
    const yesterday = [];
    const thisWeek = [];
    const older = [];

    for (const record of attendanceRecords) {
      const date = parseISO(record.date);
      if (isToday(date)) {
        today.push(record);
      } else if (isYesterday(date)) {
        yesterday.push(record);
      } else if (isSameWeek(date, new Date(), { locale: ar })) {
        thisWeek.push(record);
      } else {
        older.push(record);
      }
    }

    return { today, yesterday, thisWeek, older };
  };

  // Calcular estadísticas de asistencia
  const calculateStats = () => {
    if (!attendanceRecords || attendanceRecords.length === 0)
      return { present: 0, absent: 0, late: 0, total: 0, presentPercentage: 0 };

    const present = attendanceRecords.filter(record => record.status === 'present').length;
    const absent = attendanceRecords.filter(record => record.status === 'absent').length;
    const late = attendanceRecords.filter(record => record.status === 'late').length;
    const total = attendanceRecords.length;
    const presentPercentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return { present, absent, late, total, presentPercentage };
  };

  // Calcular estadísticas por curso
  const calculateCourseStats = (courseId: string) => {
    const courseRecords = attendanceRecords.filter(record => record.course_id === courseId);
    const present = courseRecords.filter(record => record.status === 'present').length;
    const absent = courseRecords.filter(record => record.status === 'absent').length;
    const late = courseRecords.filter(record => record.status === 'late').length;
    const total = courseRecords.length;
    const presentPercentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return { present, absent, late, total, presentPercentage };
  };

  // Función para actualizar los datos del usuario
  const refreshUserData = async () => {
    queryClient.invalidateQueries({ queryKey: ['current-user'] });
  };

  // Obtener iniciales del nombre
  const getInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  const stats = calculateStats();
  const categorized = categorizeAttendance();

  if (isLoadingUser) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
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
                    variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
                    className="justify-start"
                    onClick={() => setActiveTab('dashboard')}
                  >
                    <User className="ml-2 h-5 w-5" />
                    لوحة التحكم
                  </Button>
                  <Button
                    variant={activeTab === 'courses' ? 'default' : 'ghost'}
                    className="justify-start"
                    onClick={() => setActiveTab('courses')}
                  >
                    <BookOpen className="ml-2 h-5 w-5" />
                    الدورات
                  </Button>
                  <Button
                    variant={activeTab === 'attendance' ? 'default' : 'ghost'}
                    className="justify-start"
                    onClick={() => setActiveTab('attendance')}
                  >
                    <Calendar className="ml-2 h-5 w-5" />
                    سجل الحضور
                  </Button>
                  <Button
                    variant={activeTab === 'qr-scanner' ? 'default' : 'ghost'}
                    className="justify-start"
                    onClick={() => setActiveTab('qr-scanner')}
                  >
                    <QrCode className="ml-2 h-5 w-5" />
                    تسجيل الحضور
                  </Button>
                  <Button
                    variant={activeTab === 'reports' ? 'default' : 'ghost'}
                    className="justify-start"
                    onClick={() => setActiveTab('reports')}
                  >
                    <FileText className="ml-2 h-5 w-5" />
                    التقارير
                  </Button>
                  <Separator />
                  <LogoutButton variant="ghost" />
                </nav>
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2 font-bold lg:text-lg xl:text-xl md:text-sm">
              <Image src={LOGO} alt="شعار" className="h-8 w-8" />
              <span className="hidden md:inline-block ">نظام حضور معهد راية</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('dashboard')}
              >
                <User className="ml-2 h-4 w-4" />
                لوحة التحكم
              </Button>
              <Button
                variant={activeTab === 'courses' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('courses')}
              >
                <BookOpen className="ml-2 h-4 w-4" />
                الدورات
              </Button>
              <Button
                variant={activeTab === 'attendance' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('attendance')}
              >
                <Calendar className="ml-2 h-4 w-4" />
                سجل الحضور
              </Button>
              <Button
                variant={activeTab === 'qr-scanner' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('qr-scanner')}
              >
                <QrCode className="ml-2 h-4 w-4" />
                تسجيل الحضور
              </Button>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar>
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                      alt={user.name}
                    />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setActiveTab('profile')}>
                  <User className="ml-2 h-4 w-4" />
                  الملف الشخصي
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab('reports')}>
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
        {activeTab === 'dashboard' && (
          <>
            <DashboardHeader heading={`مرحباً، ${user.name}`} text="إليك ملخص حضورك">
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <QrCode className="ml-2 h-4 w-4" />
                    تسجيل الحضور
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>تسجيل الحضور</DialogTitle>
                    <DialogDescription>امسح رمز QR لتسجيل حضورك للمحاضرة</DialogDescription>
                  </DialogHeader>
                  <QRCodeScanner studentId={user.id} />
                </DialogContent>
              </Dialog>
            </DashboardHeader>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-6">
              <Card className="hover-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">نسبة الحضور</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.presentPercentage}%</div>
                  <Progress value={stats.presentPercentage} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    من إجمالي {stats.total} محاضرة
                  </p>
                </CardContent>
              </Card>
              <Card className="hover-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">عدد مرات الحضور</CardTitle>
                  <CheckCircle className="h-4 w-4 text-success" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.present}</div>
                  <p className="text-xs text-muted-foreground">محاضرة حاضر</p>
                </CardContent>
              </Card>
              <Card className="hover-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">عدد مرات الغياب</CardTitle>
                  <XCircle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.absent}</div>
                  <p className="text-xs text-muted-foreground">محاضرة غائب</p>
                </CardContent>
              </Card>
              <Card className="hover-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">عدد مرات التأخير</CardTitle>
                  <AlertCircle className="h-4 w-4 text-warning" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.late}</div>
                  <p className="text-xs text-muted-foreground">محاضرة متأخر</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
              <Card className="md:col-span-2 hover-card">
                <CardHeader>
                  <CardTitle>آخر سجلات الحضور</CardTitle>
                  <CardDescription>آخر 5 سجلات حضور</CardDescription>
                </CardHeader>
                <CardContent>
                  {attendanceRecords && attendanceRecords.length > 0 ? (
                    <div className="rounded-md border">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50 text-right">
                            <th className="p-2 font-medium">التاريخ</th>
                            <th className="p-2 font-medium">الدورة</th>
                            <th className="p-2 font-medium">الحالة</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendanceRecords.slice(0, 5).map(record => (
                            <tr key={record.id} className="border-b">
                              <td className="p-2">
                                {format(parseISO(record.date), 'yyyy/MM/dd', {
                                  locale: ar,
                                })}
                              </td>
                              <td className="p-2">
                                {courses.find(c => c.id === record.course_id)?.name || 'غير معروف'}
                              </td>
                              <td className="p-2">
                                <Badge
                                  className={`${
                                    record.status === 'present'
                                      ? 'bg-green-100 text-green-800 hover:bg-green-100'
                                      : record.status === 'absent'
                                        ? 'bg-red-100 text-red-800 hover:bg-red-100'
                                        : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                                  }`}
                                >
                                  {record.status === 'present'
                                    ? 'حاضر'
                                    : record.status === 'absent'
                                      ? 'غائب'
                                      : 'متأخر'}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex justify-center p-4">لا توجد سجلات حضور</div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('attendance')}>
                    عرض جميع السجلات
                  </Button>
                </CardFooter>
              </Card>

              <Card className="hover-card">
                <CardHeader>
                  <CardTitle>الدورات المسجلة</CardTitle>
                  <CardDescription>عدد الدورات: {courses.length}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {courses.slice(0, 3).map(course => (
                      <div key={course.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{course.name}</p>
                          <p className="text-sm text-muted-foreground">د. {course.doctorName}</p>
                        </div>
                        <Badge variant="outline">
                          {calculateCourseStats(course.id).presentPercentage}%
                        </Badge>
                      </div>
                    ))}
                    {courses.length > 3 && (
                      <p className="text-sm text-muted-foreground text-center">
                        +{courses.length - 3} دورات أخرى
                      </p>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('courses')}>
                    عرض جميع الدورات
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </>
        )}

        {activeTab === 'courses' && (
          <>
            <DashboardHeader heading="الدورات المسجلة" text="قائمة الدورات التي أنت مسجل فيها" />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
              {courses.length > 0 ? (
                courses.map(course => {
                  const courseStats = calculateCourseStats(course.id);
                  return (
                    <Card key={course.id} className="overflow-hidden hover-card">
                      <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-primary/70" />
                      </div>
                      <CardHeader>
                        <CardTitle>{course.name}</CardTitle>
                        <CardDescription>د. {course.doctorName}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">نسبة الحضور</span>
                              <span className="text-sm font-medium">
                                {courseStats.presentPercentage}%
                              </span>
                            </div>
                            <Progress value={courseStats.presentPercentage} />
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-muted/50 p-2 rounded-md">
                              <p className="text-xs text-muted-foreground">حضور</p>
                              <p className="font-bold">{courseStats.present}</p>
                            </div>
                            <div className="bg-muted/50 p-2 rounded-md">
                              <p className="text-xs text-muted-foreground">غياب</p>
                              <p className="font-bold">{courseStats.absent}</p>
                            </div>
                            <div className="bg-muted/50 p-2 rounded-md">
                              <p className="text-xs text-muted-foreground">تأخير</p>
                              <p className="font-bold">{courseStats.late}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setCourseDetailsOpen(true);
                            setSelectedCourseForDetails(course.id);
                          }}
                        >
                          عرض تفاصيل الدورة
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })
              ) : (
                <div className="col-span-full flex justify-center p-8 bg-muted/50 rounded-lg">
                  <p>لا توجد دورات مسجلة حالياً</p>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'attendance' && (
          <>
            <DashboardHeader heading="سجل الحضور" text="عرض سجل الحضور والغياب الخاص بك" />

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>سجل الحضور والغياب</CardTitle>
                <CardDescription>عرض سجل الحضور والغياب الخاص بك</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all">الكل</TabsTrigger>
                    <TabsTrigger value="today">اليوم</TabsTrigger>
                    <TabsTrigger value="yesterday">الأمس</TabsTrigger>
                    <TabsTrigger value="thisWeek">هذا الأسبوع</TabsTrigger>
                  </TabsList>
                  <TabsContent value="all">
                    {attendanceRecords && attendanceRecords.length > 0 ? (
                      <div className="rounded-md border">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b bg-muted/50 text-right">
                              <th className="p-2 font-medium">التاريخ</th>
                              <th className="p-2 font-medium">اليوم</th>
                              <th className="p-2 font-medium">الدورة</th>
                              <th className="p-2 font-medium">الحالة</th>
                            </tr>
                          </thead>
                          <tbody>
                            {attendanceRecords.map(record => (
                              <tr key={record.id} className="border-b">
                                <td className="p-2">
                                  {format(parseISO(record.date), 'yyyy/MM/dd', {
                                    locale: ar,
                                  })}
                                </td>
                                <td className="p-2">
                                  {format(parseISO(record.date), 'EEEE', {
                                    locale: ar,
                                  })}
                                </td>
                                <td className="p-2">
                                  {courses.find(c => c.id === record.course_id)?.name ||
                                    'غير معروف'}
                                </td>
                                <td className="p-2">
                                  <Badge
                                    className={`${
                                      record.status === 'present'
                                        ? 'bg-green-100 text-green-800 hover:bg-green-100'
                                        : record.status === 'absent'
                                          ? 'bg-red-100 text-red-800 hover:bg-red-100'
                                          : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                                    }`}
                                  >
                                    {record.status === 'present'
                                      ? 'حاضر'
                                      : record.status === 'absent'
                                        ? 'غائب'
                                        : 'متأخر'}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="flex justify-center p-4">لا توجد سجلات حضور</div>
                    )}
                  </TabsContent>
                  <TabsContent value="today">
                    {categorized.today.length > 0 ? (
                      <div className="rounded-md border">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b bg-muted/50 text-right">
                              <th className="p-2 font-medium">التاريخ</th>
                              <th className="p-2 font-medium">اليوم</th>
                              <th className="p-2 font-medium">الدورة</th>
                              <th className="p-2 font-medium">الحالة</th>
                            </tr>
                          </thead>
                          <tbody>
                            {categorized.today.map(record => (
                              <tr key={record.id} className="border-b">
                                <td className="p-2">
                                  {format(parseISO(record.date), 'yyyy/MM/dd', {
                                    locale: ar,
                                  })}
                                </td>
                                <td className="p-2">
                                  {format(parseISO(record.date), 'EEEE', {
                                    locale: ar,
                                  })}
                                </td>
                                <td className="p-2">
                                  {courses.find(c => c.id === record.course_id)?.name ||
                                    'غير معروف'}
                                </td>
                                <td className="p-2">
                                  <Badge
                                    className={`${
                                      record.status === 'present'
                                        ? 'bg-green-100 text-green-800 hover:bg-green-100'
                                        : record.status === 'absent'
                                          ? 'bg-red-100 text-red-800 hover:bg-red-100'
                                          : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                                    }`}
                                  >
                                    {record.status === 'present'
                                      ? 'حاضر'
                                      : record.status === 'absent'
                                        ? 'غائب'
                                        : 'متأخر'}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="flex justify-center p-4">لا توجد سجلات حضور لليوم</div>
                    )}
                  </TabsContent>
                  <TabsContent value="yesterday">
                    {categorized.yesterday.length > 0 ? (
                      <div className="rounded-md border">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b bg-muted/50 text-right">
                              <th className="p-2 font-medium">التاريخ</th>
                              <th className="p-2 font-medium">اليوم</th>
                              <th className="p-2 font-medium">الدورة</th>
                              <th className="p-2 font-medium">الحالة</th>
                            </tr>
                          </thead>
                          <tbody>
                            {categorized.yesterday.map(record => (
                              <tr key={record.id} className="border-b">
                                <td className="p-2">
                                  {format(parseISO(record.date), 'yyyy/MM/dd', {
                                    locale: ar,
                                  })}
                                </td>
                                <td className="p-2">
                                  {format(parseISO(record.date), 'EEEE', {
                                    locale: ar,
                                  })}
                                </td>
                                <td className="p-2">
                                  {courses.find(c => c.id === record.course_id)?.name ||
                                    'غير معروف'}
                                </td>
                                <td className="p-2">
                                  <Badge
                                    className={`${
                                      record.status === 'present'
                                        ? 'bg-green-100 text-green-800 hover:bg-green-100'
                                        : record.status === 'absent'
                                          ? 'bg-red-100 text-red-800 hover:bg-red-100'
                                          : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                                    }`}
                                  >
                                    {record.status === 'present'
                                      ? 'حاضر'
                                      : record.status === 'absent'
                                        ? 'غائب'
                                        : 'متأخر'}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="flex justify-center p-4">لا توجد سجلات حضور للأمس</div>
                    )}
                  </TabsContent>
                  <TabsContent value="thisWeek">
                    {categorized.thisWeek.length > 0 ? (
                      <div className="rounded-md border">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b bg-muted/50 text-right">
                              <th className="p-2 font-medium">التاريخ</th>
                              <th className="p-2 font-medium">اليوم</th>
                              <th className="p-2 font-medium">الدورة</th>
                              <th className="p-2 font-medium">الحالة</th>
                            </tr>
                          </thead>
                          <tbody>
                            {categorized.thisWeek.map(record => (
                              <tr key={record.id} className="border-b">
                                <td className="p-2">
                                  {format(parseISO(record.date), 'yyyy/MM/dd', {
                                    locale: ar,
                                  })}
                                </td>
                                <td className="p-2">
                                  {format(parseISO(record.date), 'EEEE', {
                                    locale: ar,
                                  })}
                                </td>
                                <td className="p-2">
                                  {courses.find(c => c.id === record.course_id)?.name ||
                                    'غير معروف'}
                                </td>
                                <td className="p-2">
                                  <Badge
                                    className={`${
                                      record.status === 'present'
                                        ? 'bg-green-100 text-green-800 hover:bg-green-100'
                                        : record.status === 'absent'
                                          ? 'bg-red-100 text-red-800 hover:bg-red-100'
                                          : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                                    }`}
                                  >
                                    {record.status === 'present'
                                      ? 'حاضر'
                                      : record.status === 'absent'
                                        ? 'غائب'
                                        : 'متأخر'}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="flex justify-center p-4">لا توجد سجلات حضور لهذا الأسبوع</div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === 'qr-scanner' && (
          <>
            <DashboardHeader heading="تسجيل الحضور" text="امسح رمز QR لتسجيل حضورك للمحاضرة" />
            <div className="mt-6 max-w-md mx-auto">
              <QRCodeScanner studentId={user.id} />
            </div>
          </>
        )}

        {activeTab === 'reports' && (
          <>
            <DashboardHeader heading="التقارير" text="تقارير الحضور والغياب" />

            <div className="grid gap-6 md:grid-cols-2 mt-6">
              <Card className="hover-card">
                <CardHeader>
                  <CardTitle>تقرير الحضور الشهري</CardTitle>
                  <CardDescription>إحصائيات الحضور خلال الشهر الحالي</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">نسبة الحضور حسب الدورة</h3>
                      {courses.map(course => {
                        const courseStats = calculateCourseStats(course.id);
                        return (
                          <div key={course.id} className="mb-4">
                            <div className="flex justify-between mb-1">
                              <span className="text-sm">{course.name}</span>
                              <span className="text-sm font-medium">
                                {courseStats.presentPercentage}%
                              </span>
                            </div>
                            <Progress value={courseStats.presentPercentage} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover-card">
                <CardHeader>
                  <CardTitle>ملخص الحضور</CardTitle>
                  <CardDescription>ملخص إحصائيات الحضور الإجمالية</CardDescription>
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
              </Card>
            </div>
          </>
        )}

        {activeTab === 'profile' && (
          <>
            <DashboardHeader heading="الملف الشخصي" text="عرض وتعديل بياناتك الشخصية" />
            <ProfileSection
              user={user}
              stats={{
                coursesCount: courses.length,
                totalLectures: stats.total,
                attendancePercentage: stats.presentPercentage,
              }}
              onUserUpdated={refreshUserData}
            />
          </>
        )}
      </main>

      {selectedCourseForDetails && (
        <CourseDetailsDialog
          open={courseDetailsOpen}
          onOpenChange={setCourseDetailsOpen}
          course={courses.find(c => c.id === selectedCourseForDetails)}
          students={[user]}
          attendanceStats={calculateCourseStats(selectedCourseForDetails)}
        />
      )}

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container flex flex-col items-center justify-center gap-4 md:flex-row md:gap-8">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} معهد راية. جميع الحقوق محفوظة.
          </p>
        </div>
      </footer>
    </div>
  );
}
