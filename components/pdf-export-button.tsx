'use client';

import { FileText, Loader2 } from 'lucide-react';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

import {
  generateCourseAttendanceReport,
  generatePDFWithTable,
  generateStudentAttendanceReport,
} from '@/lib/utils/generate-pdf';

interface PdfExportButtonProps {
  type: 'course' | 'student' | 'summary';
  title: string;
  data: {
    course?: any;
    student?: any;
    courses?: any[];
    students?: any[];
    attendanceRecords: any[];
    stats: any;
    courseStats?: any;
  };
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
}

export function PdfExportButton({
  type,
  title,
  data,
  variant = 'outline',
  size = 'sm',
  className = 'w-full',
  disabled = false,
}: PdfExportButtonProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    setIsLoading(true);
    try {
      let success = false;

      switch (type) {
        case 'course':
          if (data.course && data.students) {
            success = await generateCourseAttendanceReport(
              data.course,
              data.students,
              data.attendanceRecords
            );
          }
          break;
        case 'student':
          if (data.student && data.courses) {
            success = await generateStudentAttendanceReport(
              data.student,
              data.courses,
              data.attendanceRecords
            );
          }
          break;
        case 'summary':
          // If courseStats is already provided, use it directly
          const courseStats =
            data.courseStats ||
            data.courses?.reduce((acc, course) => {
              // Calculate course stats if not provided
              if (!course.stats) {
                const courseRecords = data.attendanceRecords.filter(
                  record => record.course_id === course.id
                );
                const present = courseRecords.filter(record => record.status === 'present').length;
                const absent = courseRecords.filter(record => record.status === 'absent').length;
                const late = courseRecords.filter(record => record.status === 'late').length;
                const total = courseRecords.length;
                const presentPercentage = total > 0 ? Math.round((present / total) * 100) : 0;

                acc[course.name] = {
                  present,
                  absent,
                  late,
                  total,
                  presentPercentage,
                };
              } else {
                acc[course.name] = course.stats;
              }
              return acc;
            }, {});

          success = await generatePDFWithTable({
            title,
            subtitle: data.student
              ? `${data.student.name} - ${new Date().toLocaleDateString('ar-EG')}`
              : new Date().toLocaleDateString('ar-EG'),
            stats: data.stats,
            courseStats,
            attendanceRecords: data.attendanceRecords.slice(0, 15), // Show only the most recent 15 records
          });
          break;
      }

      if (success) {
        toast({
          title: 'تم إنشاء التقرير',
          description: 'تم تنزيل التقرير بنجاح',
        });
      } else {
        throw new Error('فشل في إنشاء التقرير');
      }
    } catch (error) {
      console.error('خطأ أثناء إنشاء التقرير:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ في إنشاء التقرير',
        description: 'حدث خطأ أثناء إنشاء التقرير',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleExport}
      disabled={isLoading || disabled}
    >
      {isLoading ? (
        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
      ) : (
        <FileText className="ml-2 h-4 w-4" />
      )}
      تنزيل التقرير
    </Button>
  );
}
