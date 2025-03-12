-- هذا الملف يحتوي على استعلامات SQL لإصلاح جدول المستخدمين

-- 1. التحقق من وجود جدول المستخدمين
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'doctor')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. إضافة المستخدمين من نظام المصادقة إلى جدول المستخدمين المخصص
-- يمكن تنفيذ هذا الاستعلام في SQL Editor في Supabase

INSERT INTO public.users (id, name, email, password, role)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'name', email), -- استخدام البريد الإلكتروني كاسم إذا لم يكن الاسم موجودًا
  email,
  'hashed_password', -- قيمة وهمية لحقل كلمة المرور
  'student' -- افتراضي كطالب
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.users WHERE users.id = auth.users.id
);

-- 3. إضافة قيود لضمان تزامن البيانات
-- يمكن إنشاء trigger للتأكد من أن كل مستخدم في نظام المصادقة له سجل مقابل في جدول المستخدمين المخصص

