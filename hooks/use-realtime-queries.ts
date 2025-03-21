"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useQuery, useQueryClient } from "@tanstack/react-query"

// Hook to get courses for a doctor
export function useDoctorCourses(doctorId: string | undefined) {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const {
    data: courses = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["doctor-courses", doctorId],
    queryFn: async () => {
      if (!doctorId) return []

      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("doctor_id", doctorId)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!doctorId,
  })

  // Set up realtime subscription
  useEffect(() => {
    if (!doctorId) return

    const channel = supabase
      .channel("doctor-courses-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "courses",
          filter: `doctor_id=eq.${doctorId}`,
        },
        () => {
          // Invalidate and refetch when data changes
          queryClient.invalidateQueries({ queryKey: ["doctor-courses", doctorId] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [doctorId, queryClient])

  return { courses, isLoading, refetch }
}

// Hook to get students for a course
export function useCourseStudents(courseId: string | null) {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const {
    data: students = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["course-students", courseId],
    queryFn: async () => {
      if (!courseId) return []

      // First get student IDs from course_students
      const { data: courseStudents, error: courseStudentsError } = await supabase
        .from("course_students")
        .select("student_id")
        .eq("course_id", courseId)

      if (courseStudentsError) throw courseStudentsError

      if (!courseStudents.length) return []

      // Then get student details
      const studentIds = courseStudents.map((cs) => cs.student_id)
      const { data: studentsData, error: studentsError } = await supabase
        .from("users")
        .select("*")
        .in("id", studentIds)
        .eq("role", "student")

      if (studentsError) throw studentsError
      return studentsData || []
    },
    enabled: !!courseId,
  })

  // Set up realtime subscription
  useEffect(() => {
    if (!courseId) return

    const channel = supabase
      .channel("course-students-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "course_students",
          filter: `course_id=eq.${courseId}`,
        },
        () => {
          // Invalidate and refetch when data changes
          queryClient.invalidateQueries({ queryKey: ["course-students", courseId] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [courseId, queryClient])

  return { students, isLoading, refetch }
}

// Hook to get attendance records for a course
export function useCourseAttendance(courseId: string | null) {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const {
    data: attendanceRecords = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["course-attendance", courseId],
    queryFn: async () => {
      if (!courseId) return []

      // Get attendance records with student details
      const { data, error } = await supabase
        .from("attendance")
        .select(`
          id,
          student_id,
          course_id,
          date,
          status,
          created_at,
          session_id
        `)
        .eq("course_id", courseId)
        .order("date", { ascending: false })

      if (error) throw error

      // Get student details for each record
      const studentIds = [...new Set(data.map((record) => record.student_id))]

      if (studentIds.length > 0) {
        const { data: students, error: studentsError } = await supabase
          .from("users")
          .select("id, name, email")
          .in("id", studentIds)

        if (studentsError) throw studentsError

        // Map student details to attendance records
        return data.map((record) => {
          const student = students.find((s) => s.id === record.student_id)
          return {
            ...record,
            student: student || { name: "Unknown", email: "Unknown" },
          }
        })
      }

      return data
    },
    enabled: !!courseId,
  })

  // Set up realtime subscription
  useEffect(() => {
    if (!courseId) return

    const channel = supabase
      .channel("course-attendance-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attendance",
          filter: `course_id=eq.${courseId}`,
        },
        () => {
          // Invalidate and refetch when data changes
          queryClient.invalidateQueries({ queryKey: ["course-attendance", courseId] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [courseId, queryClient])

  return { attendanceRecords, isLoading, refetch }
}

// Hook to get courses for a student
export function useStudentCourses(studentId: string | undefined) {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const {
    data: courses = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["student-courses", studentId],
    queryFn: async () => {
      if (!studentId) return []

      // First get course IDs from course_students
      const { data: courseStudents, error: courseStudentsError } = await supabase
        .from("course_students")
        .select("course_id")
        .eq("student_id", studentId)

      if (courseStudentsError) throw courseStudentsError

      if (!courseStudents.length) return []

      // Then get course details with doctor name
      const courseIds = courseStudents.map((cs) => cs.course_id)
      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select(`
          id,
          name,
          doctor_id,
          created_at,
          users:doctor_id (name)
        `)
        .in("id", courseIds)

      if (coursesError) throw coursesError

      // Format the data to include doctor name
      return (
        coursesData?.map((course:any) => ({
          ...course,
          doctorName: course.users?.name || "Unknown",
        })) || []
      )
    },
    enabled: !!studentId,
  })

  // Set up realtime subscription
  useEffect(() => {
    if (!studentId) return

    const channel = supabase
      .channel("student-courses-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "course_students",
          filter: `student_id=eq.${studentId}`,
        },
        () => {
          // Invalidate and refetch when data changes
          queryClient.invalidateQueries({ queryKey: ["student-courses", studentId] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [studentId, queryClient])

  return { courses, isLoading, refetch }
}

// Hook to get attendance records for a student
export function useStudentAttendance(studentId: string | undefined) {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const {
    data: attendanceRecords = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["student-attendance", studentId],
    queryFn: async () => {
      if (!studentId) return []

      // Get attendance records for this student
      const { data, error } = await supabase
        .from("attendance")
        .select(`
          id,
          student_id,
          course_id,
          date,
          status,
          created_at
        `)
        .eq("student_id", studentId)
        .order("date", { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!studentId,
  })

  // Set up realtime subscription
  useEffect(() => {
    if (!studentId) return

    const channel = supabase
      .channel("student-attendance-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attendance",
          filter: `student_id=eq.${studentId}`,
        },
        () => {
          // Invalidate and refetch when data changes
          queryClient.invalidateQueries({ queryKey: ["student-attendance", studentId] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [studentId, queryClient])

  return { attendanceRecords, isLoading, refetch }
}



