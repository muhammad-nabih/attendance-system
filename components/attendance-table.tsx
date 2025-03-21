'use client';

import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  MoreHorizontal,
  XCircle,
} from 'lucide-react';

import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

import { createClient } from '@/lib/supabase/client';

interface AttendanceTableProps {
  records: any[];
  courseId: string;
  onUpdateStatus?: (attendanceId: string, newStatus: string) => Promise<void>;
}

export function AttendanceTable({ records, courseId, onUpdateStatus }: AttendanceTableProps) {
  const { toast } = useToast();
  const supabase = createClient();
  const [students, setStudents] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // إضافة متغيرات للتصفح
  const [currentPage, setCurrentPage] = useState(1);
  const [sessionsPerPage, setSessionsPerPage] = useState(5);
  const [displayMode, setDisplayMode] = useState<'paginated' | 'all' | 'single'>('paginated');
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  // Fetch students and sessions data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch students enrolled in this course
        const { data: courseStudents, error: studentsError } = await supabase
          .from('course_students')
          .select('student_id')
          .eq('course_id', courseId);

        if (studentsError) throw studentsError;

        // Get student details
        if (courseStudents.length > 0) {
          const studentIds = courseStudents.map(cs => cs.student_id);
          const { data: studentsData, error: studentsDataError } = await supabase
            .from('users')
            .select('*')
            .in('id', studentIds);

          if (studentsDataError) throw studentsDataError;
          setStudents(studentsData || []);
        } else {
          setStudents([]);
        }

        // Fetch sessions for this course
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('sessions')
          .select('*')
          .eq('course_id', courseId)
          .order('session_number', { ascending: true });

        if (sessionsError) throw sessionsError;
        setSessions(sessionsData || []);

        // تعيين المحاضرة الأحدث كمحاضرة مختارة افتراضياً
        if (sessionsData && sessionsData.length > 0) {
          setSelectedSession(sessionsData[sessionsData.length - 1].id);
        }
      } catch (error: any) {
        console.error('Error fetching data:', error);
        toast({
          variant: 'destructive',
          title: 'خطأ في تحميل البيانات',
          description: error.message || 'حدث خطأ أثناء تحميل البيانات',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (courseId) {
      fetchData();
    }
  }, [courseId, records]);

  // Group records by student and session
  const attendanceMap = new Map();
  records.forEach(record => {
    const key = `${record.student_id}-${record.session_id}`;
    attendanceMap.set(key, record);
  });

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            حاضر
          </Badge>
        );
      case 'absent':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            غائب
          </Badge>
        );
      case 'late':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="h-3 w-3 mr-1" />
            متأخر
          </Badge>
        );
      default:
        return null;
    }
  };

  // حساب عدد الصفحات
  const totalPages = Math.ceil(sessions.length / sessionsPerPage);

  // الحصول على المحاضرات المعروضة حالياً
  const getDisplayedSessions = () => {
    if (displayMode === 'all') {
      return sessions;
    } else if (displayMode === 'single' && selectedSession) {
      return sessions.filter(session => session.id === selectedSession);
    } else {
      // وضع التصفح
      const startIndex = (currentPage - 1) * sessionsPerPage;
      return sessions.slice(startIndex, startIndex + sessionsPerPage);
    }
  };

  const displayedSessions = getDisplayedSessions();

  // التنقل بين الصفحات
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-4">جاري تحميل البيانات...</div>;
  }

  if (sessions.length === 0) {
    return <div className="flex justify-center p-4">لا توجد محاضرات مسجلة لهذه الدورة</div>;
  }

  return (
    <div className="space-y-4">
      {/* أدوات التحكم في العرض */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm">طريقة العرض:</span>
          <Select
            value={displayMode}
            onValueChange={(value: 'paginated' | 'all' | 'single') => {
              setDisplayMode(value);
              setCurrentPage(1); // إعادة تعيين الصفحة الحالية عند تغيير طريقة العرض
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="اختر طريقة العرض" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paginated">تصفح المحاضرات</SelectItem>
              <SelectItem value="all">جميع المحاضرات</SelectItem>
              <SelectItem value="single">محاضرة واحدة</SelectItem>
            </SelectContent>
          </Select>

          {displayMode === 'single' && (
            <Select value={selectedSession || ''} onValueChange={setSelectedSession}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="اختر المحاضرة" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map(session => (
                  <SelectItem key={session.id} value={session.id}>
                    محاضرة {session.session_number} -{' '}
                    {format(parseISO(session.date), 'yyyy/MM/dd', {
                      locale: ar,
                    })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {displayMode === 'paginated' && (
            <Select
              value={sessionsPerPage.toString()}
              onValueChange={value => setSessionsPerPage(Number.parseInt(value))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="عدد المحاضرات في الصفحة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 محاضرات</SelectItem>
                <SelectItem value="5">5 محاضرات</SelectItem>
                <SelectItem value="10">10 محاضرات</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {displayMode === 'paginated' && totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              صفحة {currentPage} من {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* جدول الحضور */}
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-2 text-right font-medium sticky right-0 bg-muted/50 z-10">الطالب</th>
              {displayedSessions.map(session => (
                <th key={session.id} className="p-2 text-center font-medium whitespace-nowrap">
                  محاضرة {session.session_number}
                  <br />
                  <span className="text-xs font-normal">
                    {format(parseISO(session.date), 'yyyy/MM/dd', {
                      locale: ar,
                    })}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map(student => (
              <tr key={student.id} className="border-b">
                <td className="p-2 sticky right-0 bg-background z-10">
                  <div className="font-medium">{student.name}</div>
                  <div className="text-xs text-muted-foreground">{student.email}</div>
                </td>
                {displayedSessions.map(session => {
                  const record = attendanceMap.get(`${student.id}-${session.id}`);
                  return (
                    <td key={session.id} className="p-2 text-center">
                      {record ? (
                        <div className="flex flex-col items-center gap-1">
                          {getStatusBadge(record.status)}
                          {onUpdateStatus && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">تغيير الحالة</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="center">
                                <DropdownMenuItem
                                  onClick={() => onUpdateStatus(record.id, 'present')}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                  تعيين كحاضر
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onUpdateStatus(record.id, 'late')}>
                                  <Clock className="h-4 w-4 mr-2 text-yellow-600" />
                                  تعيين كمتأخر
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => onUpdateStatus(record.id, 'absent')}
                                >
                                  <XCircle className="h-4 w-4 mr-2 text-red-600" />
                                  تعيين كغائب
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      ) : (
                        <div className="text-muted-foreground text-sm">لم يسجل</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* أزرار التنقل للشاشات الصغيرة */}
      {displayMode === 'paginated' && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 md:hidden mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            صفحة {currentPage} من {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
