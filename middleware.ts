import { updateSession } from '@/lib/supabase/middlewar'
import { type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    '/signup',
    '/doctor-dash/:path*',
    '/student-dash/:path*',
    '/'
  ],
}
