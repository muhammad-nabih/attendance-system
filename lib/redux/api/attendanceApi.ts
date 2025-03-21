import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export interface AttendanceRecord {
  id: string;
  student_id: string;
  course_id: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  created_at: string;
}

export interface Course {
  id: string;
  name: string;
  doctor_id: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
}

export const attendanceApi = createApi({
  reducerPath: 'attendanceApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      headers.set('apikey', process.env.NEXT_PUBLIC_SUPABASE_KEY || '');
      return headers;
    },
  }),
  tagTypes: ['Attendance', 'Course', 'Student'],
  endpoints: builder => ({
    // الحصول على سجلات الحضور لدورة معينة
    getCourseAttendance: builder.query<AttendanceRecord[], string>({
      query: courseId => ({
        url: `/rest/v1/attendance?course_id=eq.${courseId}&select=*`,
        method: 'GET',
      }),
      providesTags: ['Attendance'],
    }),

    // الحصول على سجلات الحضور لطالب معين
    getStudentAttendance: builder.query<AttendanceRecord[], string>({
      query: studentId => ({
        url: `/rest/v1/attendance?student_id=eq.${studentId}&select=*`,
        method: 'GET',
      }),
      providesTags: ['Attendance'],
    }),

    // تسجيل حضور طالب
    recordAttendance: builder.mutation<void, Partial<AttendanceRecord>>({
      query: record => ({
        url: '/rest/v1/attendance',
        method: 'POST',
        body: {
          ...record,
          date: format(new Date(), 'yyyy-MM-dd', { locale: ar }),
          created_at: new Date().toISOString(),
        },
      }),
      invalidatesTags: ['Attendance'],
    }),

    // تحديث حالة حضور طالب
    updateAttendance: builder.mutation<void, Partial<AttendanceRecord>>({
      query: ({ id, ...record }) => ({
        url: `/rest/v1/attendance?id=eq.${id}`,
        method: 'PATCH',
        body: record,
      }),
      invalidatesTags: ['Attendance'],
    }),

    // الحصول على قائمة الدورات للدكتور
    getDoctorCourses: builder.query<Course[], string>({
      query: doctorId => ({
        url: `/rest/v1/courses?doctor_id=eq.${doctorId}&select=*`,
        method: 'GET',
      }),
      providesTags: ['Course'],
    }),

    // الحصول على قائمة الطلاب في دورة معينة
    getCourseStudents: builder.query<Student[], string>({
      query: courseId => ({
        url: `/rest/v1/course_students?course_id=eq.${courseId}&select=student:students(*)`,
        method: 'GET',
        transformResponse: (response: any[]) => response.map(item => item.student),
      }),
      providesTags: ['Student'],
    }),
  }),
});

export const {
  useGetCourseAttendanceQuery,
  useGetStudentAttendanceQuery,
  useRecordAttendanceMutation,
  useUpdateAttendanceMutation,
  useGetDoctorCoursesQuery,
  useGetCourseStudentsQuery,
} = attendanceApi;
