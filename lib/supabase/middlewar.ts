import { createServerClient } from '@supabase/ssr';

import { type NextRequest, NextResponse } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // إذا كان المستخدم مسجل، نحصل على دوره من جدول users
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const userRole = userData?.role;

    // إذا كان المستخدم مسجل ويحاول الوصول إلى صفحة التسجيل
    if (request.nextUrl.pathname.startsWith('/signup')) {
      const url = request.nextUrl.clone();

      // توجيه المستخدم إلى اللوحة المناسبة حسب دوره
      if (userRole === 'doctor') {
        url.pathname = '/doctor-dash';
      } else if (userRole === 'student') {
        url.pathname = '/student-dash';
      }

      return NextResponse.redirect(url);
    }

    // منع الوصول إلى اللوحات غير المصرح بها
    if (userRole === 'doctor' && request.nextUrl.pathname.startsWith('/student-dash')) {
      const url = request.nextUrl.clone();
      url.pathname = '/doctor-dash';
      return NextResponse.redirect(url);
    }

    if (userRole === 'student' && request.nextUrl.pathname.startsWith('/doctor-dash')) {
      const url = request.nextUrl.clone();
      url.pathname = '/student-dash';
      return NextResponse.redirect(url);
    }
  } else {
    // إذا لم يكن المستخدم مسجل ويحاول الوصول إلى صفحات محمية
    if (
      request.nextUrl.pathname.startsWith('/doctor-dash') ||
      request.nextUrl.pathname.startsWith('/student-dash')
    ) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
