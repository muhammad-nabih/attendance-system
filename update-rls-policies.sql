-- إضافة سياسة تسمح بإنشاء مستخدمين جدد
DROP POLICY IF EXISTS "يمكن للمستخدمين إنشاء حسابات جديدة" ON users;

-- سياسة تسمح بإنشاء مستخدمين جدد (مطلوبة لعملية التسجيل)
CREATE POLICY "يمكن للمستخدمين إنشاء حسابات جديدة" ON users
FOR INSERT WITH CHECK (true);

-- سياسة تسمح للمستخدمين بتحديث بياناتهم الخاصة
DROP POLICY IF EXISTS "يمكن للمستخدمين تحديث بياناتهم" ON users;
CREATE POLICY "يمكن للمستخدمين تحديث بياناتهم" ON users
FOR UPDATE USING (auth.uid() = id);

-- تأكيد أن سياسة القراءة موجودة
DROP POLICY IF EXISTS "يمكن للجميع رؤية المستخدمين" ON users;
CREATE POLICY "يمكن للجميع رؤية المستخدمين" ON users
FOR SELECT USING (true);

