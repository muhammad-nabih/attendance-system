'use client';

import { useQueryClient } from '@tanstack/react-query';

import { useState } from 'react';

import { useToast } from '@/components/ui/use-toast';

export function useCourseOperations() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Delete a course
  const deleteCourse = async (courseId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/courses/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete course');
      }

      toast({
        title: 'تم بنجاح',
        description: 'تم حذف الدورة بنجاح',
      });

      // Invalidate queries
      await queryClient.invalidateQueries({ queryKey: ['doctor-courses'] });
      return true;
    } catch (error) {
      console.error('Error deleting course:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ في حذف الدورة',
        description: error.message || 'حدث خطأ أثناء محاولة حذف الدورة',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Update course name
  const updateCourseName = async (courseId: string, name: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/courses/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update course');
      }

      toast({
        title: 'تم بنجاح',
        description: `تم تعديل اسم الدورة إلى ${name}`,
      });

      // Invalidate queries
      await queryClient.invalidateQueries({ queryKey: ['doctor-courses'] });
      return true;
    } catch (error) {
      console.error('Error updating course:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ في تعديل اسم الدورة',
        description: error.message || 'حدث خطأ أثناء محاولة تعديل اسم الدورة',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete all courses for a doctor
  const deleteAllCourses = async (doctorId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/courses/delete-all', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ doctorId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete courses');
      }

      toast({
        title: 'تم بنجاح',
        description: data.message || 'تم حذف جميع الدورات بنجاح',
      });

      // Invalidate queries
      await queryClient.invalidateQueries({ queryKey: ['doctor-courses'] });
      return true;
    } catch (error) {
      console.error('Error deleting all courses:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ في حذف الدورات',
        description: error.message || 'حدث خطأ أثناء محاولة حذف جميع الدورات',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    deleteCourse,
    updateCourseName,
    deleteAllCourses,
    isLoading,
  };
}
