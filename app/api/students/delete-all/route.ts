import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export async function DELETE(request: Request) {
  try {
    const { courseId } = await request.json();

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify the user is authenticated and is a doctor
    const {
      data: { user },
      error: authError,
    } = await supabase?.auth?.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the user is the owner of the course
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('doctor_id')
      .eq('id', courseId)
      .single();

    if (courseError || !courseData) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    if (courseData.doctor_id !== user.id) {
      return NextResponse.json(
        {
          error: "You don't have permission to remove students from this course",
        },
        { status: 403 }
      );
    }

    // Delete attendance records for this course
    const { error: attendanceError } = await supabase
      .from('attendance')
      .delete()
      .eq('course_id', courseId);

    if (attendanceError) {
      console.error('Error deleting attendance records:', attendanceError);
      return NextResponse.json(
        {
          error: `Error deleting attendance records: ${attendanceError.message}`,
        },
        { status: 500 }
      );
    }

    // Delete course_students relationships
    const { error: courseStudentsError } = await supabase
      .from('course_students')
      .delete()
      .eq('course_id', courseId);

    if (courseStudentsError) {
      console.error('Error deleting course_students:', courseStudentsError);
      return NextResponse.json(
        {
          error: `Error deleting course_students: ${courseStudentsError.message}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully removed all students from the course',
    });
  } catch (error) {
    console.error('Unexpected error in students deletion:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
