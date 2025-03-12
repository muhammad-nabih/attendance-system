-- إضافة عمود session_id إلى جدول attendance إذا لم يكن موجوداً
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS session_id TEXT;

-- إضافة فهرس على عمود session_id
CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON attendance(session_id);

-- إضافة قيود فريدة جديدة
ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_student_id_course_id_date_key;
ALTER TABLE attendance ADD CONSTRAINT attendance_student_id_course_id_date_session_id_key UNIQUE (student_id, course_id, date, session_id);

-- تحديث سياسات الأمان
DROP POLICY IF EXISTS "يمكن للجميع رؤية سجلات الحضور" ON attendance;
CREATE POLICY "يمكن للجميع رؤية سجلات الحضور" ON attendance
FOR SELECT USING (true);

DROP POLICY IF EXISTS "الدكاترة يمكنهم إنشاء سجلات الحضور" ON attendance;
CREATE POLICY "الدكاترة يمكنهم إنشاء سجلات الحضور" ON attendance
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'doctor')
);

DROP POLICY IF EXISTS "الدكاترة يمكنهم تحديث سجلات الحضور" ON attendance;
CREATE POLICY "الدكاترة يمكنهم تحديث سجلات الحضور" ON attendance
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'doctor')
);

-- إضافة سياسة للطلاب لإنشاء سجلات الحضور الخاصة بهم (لدعم تسجيل الحضور بواسطة QR)
DROP POLICY IF EXISTS "الطلاب يمكنهم إنشاء سجلات الحضور الخاصة بهم" ON attendance;
CREATE POLICY "الطلاب يمكنهم إنشاء سجلات الحضور الخاصة بهم" ON attendance
FOR INSERT WITH CHECK (
  auth.uid() = student_id
);

