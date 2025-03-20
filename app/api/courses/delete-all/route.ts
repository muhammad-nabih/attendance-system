import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function DELETE(request: Request) {
  try {
    const { doctorId } = await request.json()

    if (!doctorId) {
      return NextResponse.json({ error: "Doctor ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify the user is authenticated and is the doctor
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user || user.id !== doctorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all courses for this doctor
    const { data: courses, error: coursesError } = await supabase.from("courses").select("id").eq("doctor_id", doctorId)
  console.log(courses)
    if (coursesError) {
      console.error("Error fetching courses:", coursesError)
      return NextResponse.json({ error: `Error fetching courses: ${coursesError.message}` }, { status: 500 })
    }

    if (!courses || courses.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No courses to delete",
      })
    }

    const courseIds = courses.map((course: { id: string }) => course.id)

    // Delete in order: attendance records, course_students, sessions, and finally the courses

    // 1. Delete attendance records
    const { error: attendanceError } = await supabase.from("attendance").delete().in("course_id", courseIds)

    if (attendanceError) {
      console.error("Error deleting attendance records:", attendanceError)
      return NextResponse.json(
        { error: `Error deleting attendance records: ${attendanceError.message}` },
        { status: 500 },
      )
    }

    // 2. Delete course_students relationships
    const { error: courseStudentsError } = await supabase.from("course_students").delete().in("course_id", courseIds)

    if (courseStudentsError) {
      console.error("Error deleting course_students:", courseStudentsError)
      return NextResponse.json(
        { error: `Error deleting course_students: ${courseStudentsError.message}` },
        { status: 500 },
      )
    }

    // 3. Delete sessions
    const { error: sessionsError } = await supabase.from("sessions").delete().in("course_id", courseIds)

    if (sessionsError) {
      console.error("Error deleting sessions:", sessionsError)
      return NextResponse.json({ error: `Error deleting sessions: ${sessionsError.message}` }, { status: 500 })
    }

    // 4. Delete the courses
    const { error: deleteCoursesError } = await supabase.from("courses").delete().in("id", courseIds)

    if (deleteCoursesError) {
      console.error("Error deleting courses:", deleteCoursesError)
      return NextResponse.json({ error: `Error deleting courses: ${deleteCoursesError.message}` }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${courseIds.length} course(s)`,
    })
  } catch (error) {
    console.error("Unexpected error in courses deletion:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
