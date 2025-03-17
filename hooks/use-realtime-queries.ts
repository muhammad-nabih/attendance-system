"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

// Supabase client
const supabase = createClient()

// Función para obtener los cursos de un doctor
export function useDoctorCourses(doctorId: string | undefined) {
  const queryClient = useQueryClient()

  const {
    data: courses = [],
    isLoading,
    error,
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

  // Suscripción a cambios en tiempo real
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
          // Invalidar la consulta para que se vuelva a cargar
          queryClient.invalidateQueries({ queryKey: ["doctor-courses", doctorId] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [doctorId, queryClient])

  return { courses, isLoading, error }
}

// Función para obtener los estudiantes de un curso
export function useCourseStudents(courseId: string | null) {
  const queryClient = useQueryClient()

  const {
    data: students = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["course-students", courseId],
    queryFn: async () => {
      if (!courseId) return []

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
      return data.map((item: any) => ({
        id: item.student.id,
        name: item.student.name,
        email: item.student.email,
      }))
    },
    enabled: !!courseId,
  })

  // Suscripción a cambios en tiempo real
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
          // Invalidar la consulta para que se vuelva a cargar
          queryClient.invalidateQueries({ queryKey: ["course-students", courseId] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [courseId, queryClient])

  return { students, isLoading, error }
}

// Función para obtener los registros de asistencia de un curso
export function useCourseAttendance(courseId: string | null) {
  const queryClient = useQueryClient()

  const {
    data: attendanceRecords = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["course-attendance", courseId],
    queryFn: async () => {
      if (!courseId) return []

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
      return data || []
    },
    enabled: !!courseId,
  })

  // Suscripción a cambios en tiempo real
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
          // Invalidar la consulta para que se vuelva a cargar
          queryClient.invalidateQueries({ queryKey: ["course-attendance", courseId] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [courseId, queryClient])

  return { attendanceRecords, isLoading, error }
}

// Función para obtener los cursos de un estudiante
export function useStudentCourses(studentId: string | undefined) {
  const queryClient = useQueryClient()

  const {
    data: courses = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["student-courses", studentId],
    queryFn: async () => {
      if (!studentId) return []

      const { data, error } = await supabase
        .from("course_students")
        .select(`
          course:course_id(
            id,
            name,
            doctor:doctor_id(
              name
            )
          )
        `)
        .eq("student_id", studentId)

      if (error) throw error

      // Transform the data to a more usable format
      return data.map((item: any) => ({
        id: item.course.id,
        name: item.course.name,
        doctorName: item.course.doctor.name,
      }))
    },
    enabled: !!studentId,
  })

  // Suscripción a cambios en tiempo real
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
          // Invalidar la consulta para que se vuelva a cargar
          queryClient.invalidateQueries({ queryKey: ["student-courses", studentId] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [studentId, queryClient])

  return { courses, isLoading, error }
}

// Función para obtener los registros de asistencia de un estudiante
export function useStudentAttendance(studentId: string | undefined) {
  const queryClient = useQueryClient()

  const {
    data: attendanceRecords = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["student-attendance", studentId],
    queryFn: async () => {
      if (!studentId) return []

      const { data, error } = await supabase
        .from("attendance")
        .select(`
          id,
          date,
          status,
          course_id
        `)
        .eq("student_id", studentId)
        .order("date", { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!studentId,
  })

  // Suscripción a cambios en tiempo real
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
          // Invalidar la consulta para que se vuelva a cargar
          queryClient.invalidateQueries({ queryKey: ["student-attendance", studentId] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [studentId, queryClient])

  return { attendanceRecords, isLoading, error }
}

// Función para actualizar el estado de asistencia
export async function updateAttendanceStatus(recordId: string, status: "present" | "absent" | "late") {
  const { error } = await supabase.from("attendance").update({ status }).eq("id", recordId)

  if (error) throw error
  return true
}

