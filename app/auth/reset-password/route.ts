import { type NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = await createClient();

    try {
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('Error exchanging code for session:', error);
        return NextResponse.redirect(new URL('/forgot-password?error=invalid_code', request.url));
      }

      // Redirect to the reset password page with the tokens in the hash
      // This way they're not sent to the server but are available to the client
      const resetUrl = new URL('/reset-password', request.url);
      resetUrl.hash = `access_token=${data.session.access_token}&refresh_token=${data.session.refresh_token}&type=recovery`;

      return NextResponse.redirect(resetUrl);
    } catch (err) {
      console.error('Error in reset password flow:', err);
      return NextResponse.redirect(new URL('/forgot-password?error=server_error', request.url));
    }
  }

  // If no code is provided, redirect to the forgot password page
  return NextResponse.redirect(new URL('/forgot-password', request.url));
}
