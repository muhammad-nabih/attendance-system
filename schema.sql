-- إنشاء جدول المستخدمين
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'doctor')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول الدورات
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  doctor_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول لربط الطلاب بالدورات
CREATE TABLE course_students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id),
  student_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(course_id, student_id)
);

-- إنشاء جدول سجلات الحضور
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id),
  course_id UUID NOT NULL REFERENCES courses(id),
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, course_id, date)
);

-- إنشاء سياسات الأمان (RLS)
-- تمكين RLS على جميع الجداول
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- سياسات للمستخدمين
CREATE POLICY "المستخدمون يمكنهم رؤية أنفسهم فقط" ON users
  FOR SELECT USING (auth.uid() = id);

-- سياسات للدورات
CREATE POLICY "الدكاترة يمكنهم رؤية دوراتهم" ON courses
  FOR SELECT USING (auth.uid() = doctor_id OR 
                   EXISTS (SELECT 1 FROM course_students WHERE course_id = id AND student_id = auth.uid()));

CREATE POLICY "الدكاترة يمكنهم إنشاء دورات" ON courses
  FOR INSERT WITH CHECK (auth.uid() = doctor_id);

-- سياسات لربط الطلاب بالدورات
CREATE POLICY "الدكاترة يمكنهم رؤية طلاب دوراتهم" ON course_students
  FOR SELECT USING (EXISTS (SELECT 1 FROM courses WHERE id = course_id AND doctor_id = auth.uid()) OR 
                   student_id = auth.uid());

CREATE POLICY "الدكاترة يمكنهم إضافة طلاب إلى دوراتهم" ON course_students
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM courses WHERE id = course_id AND doctor_id = auth.uid()));

-- سياسات لسجلات الحضور
CREATE POLICY "الدكاترة والطلاب يمكنهم رؤية سجلات الحضور" ON attendance
  FOR SELECT USING (EXISTS (SELECT 1 FROM courses WHERE id = course_id AND doctor_id = auth.uid()) OR 
                   student_id = auth.uid());

CREATE POLICY "الدكاترة يمكنهم إنشاء وتحديث سجلات الحضور" ON attendance
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM courses WHERE id = course_id AND doctor_id = auth.uid()));

CREATE POLICY "الدكاترة يمكنهم تحديث سجلات الحضور" ON attendance
  FOR UPDATE USING (EXISTS (SELECT 1 FROM courses WHERE id = course_id AND doctor_id = auth.uid()));

