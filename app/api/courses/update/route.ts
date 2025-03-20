import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PUT(request: Request) {
  try {
    const { courseId, name } = await request.json()

    if (!courseId || !name) {
      return NextResponse.json({ error: "Course ID and name are required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify the user is authenticated and is a doctor
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify the user is the owner of the course
    const { data: courseData, error: courseError } = await supabase
      .from("courses")
      .select("doctor_id")
      .eq("id", courseId)
      .single()

    if (courseError || !courseData) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    if (courseData.doctor_id !== user.id) {
      return NextResponse.json({ error: "You don't have permission to update this course" }, { status: 403 })
    }

    // Update the course name
    const { data: updatedCourse, error: updateError } = await supabase
      .from("courses")
      .update({ name: name.trim() })
      .eq("id", courseId)
      .select()

    if (updateError) {
      console.error("Error updating course:", updateError)
      return NextResponse.json({ error: `Error updating course: ${updateError.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, course: updatedCourse[0] })
  } catch (error) {
    console.error("Unexpected error in course update:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

