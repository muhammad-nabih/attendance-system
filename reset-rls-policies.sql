-- إلغاء جميع سياسات الأمان الحالية
DROP POLICY IF EXISTS "المستخدمون يمكنهم رؤية أنفسهم فقط" ON users;
DROP POLICY IF EXISTS "الدكاترة يمكنهم رؤية دوراتهم" ON courses;
DROP POLICY IF EXISTS "الدكاترة يمكنهم إنشاء دورات" ON courses;
DROP POLICY IF EXISTS "الدكاترة يمكنهم رؤية طلاب دوراتهم" ON course_students;
DROP POLICY IF EXISTS "الدكاترة يمكنهم إضافة طلاب إلى دوراتهم" ON course_students;
DROP POLICY IF EXISTS "الدكاترة والطلاب يمكنهم رؤية سجلات الحضور" ON attendance;
DROP POLICY IF EXISTS "الدكاترة يمكنهم إنشاء وتحديث سجلات الحضور" ON attendance;
DROP POLICY IF EXISTS "الدكاترة يمكنهم تحديث سجلات الحضور" ON attendance;
DROP POLICY IF EXISTS "يمكن للجميع رؤية المستخدمين" ON users;
DROP POLICY IF EXISTS "يمكن للجميع رؤية الدورات" ON courses;
DROP POLICY IF EXISTS "يمكن للجميع رؤية علاقات الطلاب بالدورات" ON course_students;
DROP POLICY IF EXISTS "يمكن للجميع رؤية سجلات الحضور" ON attendance;
DROP POLICY IF EXISTS "يمكن للمستخدمين إنشاء حسابات جديدة" ON users;
DROP POLICY IF EXISTS "يمكن للمستخدمين تحديث بياناتهم" ON users;

-- تعطيل RLS مؤقتًا على جميع الجداول للتأكد من عدم وجود أي سياسات متبقية
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE course_students DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;

-- إعادة تمكين RLS على جميع الجداول
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات أمان بسيطة وفعالة

-- سياسات للمستخدمين
-- سياسة للقراءة: يمكن للجميع رؤية جميع المستخدمين (مطلوب للعرض)
CREATE POLICY "يمكن للجميع رؤية المستخدمين" ON users
FOR SELECT USING (true);

-- سياسة للإنشاء: يمكن للجميع إنشاء مستخدمين جدد (مطلوب للتسجيل)
CREATE POLICY "يمكن للمستخدمين إنشاء حسابات جديدة" ON users
FOR INSERT WITH CHECK (true);

-- سياسة للتحديث: يمكن للمستخدمين تحديث بياناتهم الخاصة فقط
CREATE POLICY "يمكن للمستخدمين تحديث بياناتهم" ON users
FOR UPDATE USING (auth.uid() = id);

-- سياسة للدورات: يمكن للجميع رؤية جميع الدورات (مطلوب للعرض)
CREATE POLICY "يمكن للجميع رؤية الدورات" ON courses
FOR SELECT USING (true);

-- سياسة لإنشاء الدورات: فقط الدكاترة يمكنهم إنشاء دورات
CREATE POLICY "الدكاترة يمكنهم إنشاء دورات" ON courses
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'doctor')
);

-- سياسة لربط الطلاب بالدورات: يمكن للجميع رؤية جميع العلاقات (مطلوب للعرض)
CREATE POLICY "يمكن للجميع رؤية علاقات الطلاب بالدورات" ON course_students
FOR SELECT USING (true);

-- سياسة لإضافة طلاب إلى الدورات: فقط الدكاترة يمكنهم إضافة طلاب
CREATE POLICY "الدكاترة يمكنهم إضافة طلاب إلى الدورات" ON course_students
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'doctor')
);

-- سياسة لسجلات الحضور: يمكن للجميع رؤية جميع سجلات الحضور (مطلوب للعرض)
CREATE POLICY "يمكن للجميع رؤية سجلات الحضور" ON attendance
FOR SELECT USING (true);

-- سياسة لإنشاء سجلات الحضور: فقط الدكاترة يمكنهم إنشاء سجلات الحضور
CREATE POLICY "الدكاترة يمكنهم إنشاء سجلات الحضور" ON attendance
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'doctor')
);

-- سياسة لتحديث سجلات الحضور: فقط الدكاترة يمكنهم تحديث سجلات الحضور
CREATE POLICY "الدكاترة يمكنهم تحديث سجلات الحضور" ON attendance
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'doctor')
);

