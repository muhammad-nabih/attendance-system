'use client';

import { supabase } from '@/lib/supabase/client';

// Eliminar la línea que crea el cliente Supabase
// export const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_KEY!)

// دالة لتسجيل الدخول
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  // الحصول على بيانات المستخدم من جدول المستخدمين
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (userError) throw userError;

  return {
    user: userData,
    token: data.session.access_token,
  };
}

// دالة لإنشاء حساب جديد
export async function signUp(
  name: string,
  email: string,
  password: string,
  role: 'student' | 'doctor'
) {
  // إنشاء حساب في نظام المصادقة
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;

  // إضافة المستخدم إلى جدول المستخدمين
  const { data: userData, error: userError } = await supabase
    .from('users')
    .insert([
      {
        id: data.user?.id,
        name,
        email,
        password: 'hashed_password', // في الواقع يجب تشفير كلمة المرور
        role,
      },
    ])
    .select();

  if (userError) throw userError;

  return {
    user: userData[0],
    token: data.session?.access_token,
  };
}

// دالة لتسجيل الخروج
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
