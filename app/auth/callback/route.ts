import { type NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const type = requestUrl.searchParams.get('type');
  const supabase = await createClient();

  console.log('Auth callback received:', {
    code: code ? 'موجود' : 'غير موجود',
    type: type || 'غير موجود',
  });

  // Handle password reset flow (type=recovery or type is missing)
  if (code && (type === 'recovery' || !type)) {
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('Error exchanging code for session:', error);
        return NextResponse.redirect(
          new URL('/forgot-password?error=invalid_code', requestUrl.origin)
        );
      }

      console.log('Session data:', {
        access_token: data.session?.access_token ? 'موجود' : 'غير موجود',
        refresh_token: data.session?.refresh_token ? 'موجود' : 'غير موجود',
      });

      const resetUrl = new URL('/reset-password', requestUrl.origin);
      resetUrl.hash = `access_token=${data.session.access_token}&refresh_token=${data.session.refresh_token}`;

      console.log('Redirecting to:', resetUrl.toString());
      return NextResponse.redirect(resetUrl);
    } catch (err) {
      console.error('Error in reset password flow:', err);
      return NextResponse.redirect(
        new URL('/forgot-password?error=server_error', requestUrl.origin)
      );
    }
  }

  // For other authentication types, redirect to the homepage
  return NextResponse.redirect(new URL('/', requestUrl.origin));
}
