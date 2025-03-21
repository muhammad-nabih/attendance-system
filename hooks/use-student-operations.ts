'use client';

import { useQueryClient } from '@tanstack/react-query';

import { useState } from 'react';

import { useToast } from '@/components/ui/use-toast';

export function useStudentOperations() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Delete students from a course
  const deleteStudents = async (studentIds: string[], courseId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/students/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentIds, courseId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete students');
      }

      toast({
        title: 'تم بنجاح',
        description: data.message || `تم حذف ${studentIds.length} طالب من الدورة بنجاح`,
      });

      // Invalidate queries
      await queryClient.invalidateQueries({
        queryKey: ['course-students', courseId],
      });
      await queryClient.invalidateQueries({
        queryKey: ['course-attendance', courseId],
      });
      return true;
    } catch (error) {
      console.error('Error deleting students:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ في حذف الطلاب',
        description: error.message || 'حدث خطأ أثناء محاولة حذف الطلاب من الدورة',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete all students from a course
  const deleteAllStudents = async (courseId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/students/delete-all', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete all students');
      }

      toast({
        title: 'تم بنجاح',
        description: data.message || 'تم حذف جميع الطلاب من الدورة بنجاح',
      });

      // Invalidate queries
      await queryClient.invalidateQueries({
        queryKey: ['course-students', courseId],
      });
      await queryClient.invalidateQueries({
        queryKey: ['course-attendance', courseId],
      });
      return true;
    } catch (error) {
      console.error('Error deleting all students:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ في حذف الطلاب',
        description: error.message || 'حدث خطأ أثناء محاولة حذف جميع الطلاب من الدورة',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    deleteStudents,
    deleteAllStudents,
    isLoading,
  };
}
