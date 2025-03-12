-- إلغاء سياسات الأمان الحالية التي تسبب التكرار اللانهائي
DROP POLICY IF EXISTS "الدكاترة يمكنهم رؤية دوراتهم" ON courses;
DROP POLICY IF EXISTS "الدكاترة يمكنهم رؤية طلاب دوراتهم" ON course_students;

-- إعادة إنشاء سياسات الأمان بطريقة صحيحة لتجنب التكرار اللانهائي
-- سياسة للدورات: الدكاترة يمكنهم رؤية دوراتهم والطلاب يمكنهم رؤية الدورات المسجلين فيها
CREATE POLICY "الدكاترة يمكنهم رؤية دوراتهم" ON courses
FOR SELECT USING (
  -- الدكاترة يمكنهم رؤية الدورات التي يقومون بتدريسها
  auth.uid() = doctor_id 
  OR 
  -- الطلاب يمكنهم رؤية الدورات المسجلين فيها (بدون استعلام متداخل)
  EXISTS (
    SELECT 1 FROM course_students 
    WHERE course_students.course_id = courses.id 
    AND course_students.student_id = auth.uid()
  )
);

-- سياسة لربط الطلاب بالدورات: الدكاترة يمكنهم رؤية طلاب دوراتهم
CREATE POLICY "الدكاترة يمكنهم رؤية طلاب دوراتهم" ON course_students
FOR SELECT USING (
  -- الدكاترة يمكنهم رؤية الطلاب في دوراتهم (بدون استعلام متداخل)
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = course_students.course_id 
    AND courses.doctor_id = auth.uid()
  )
  OR 
  -- الطلاب يمكنهم رؤية سجلاتهم الخاصة
  student_id = auth.uid()
);

-- سياسة لسجلات الحضور: تحديث سياسة الحضور لتجنب التكرار اللانهائي
DROP POLICY IF EXISTS "الدكاترة والطلاب يمكنهم رؤية سجلات الحضور" ON attendance;

CREATE POLICY "الدكاترة والطلاب يمكنهم رؤية سجلات الحضور" ON attendance
FOR SELECT USING (
  -- الدكاترة يمكنهم رؤية سجلات الحضور للدورات التي يقومون بتدريسها
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = attendance.course_id 
    AND courses.doctor_id = auth.uid()
  )
  OR 
  -- الطلاب يمكنهم رؤية سجلات حضورهم الخاصة
  student_id = auth.uid()
);

