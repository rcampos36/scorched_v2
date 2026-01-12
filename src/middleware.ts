import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect admin dashboard
  if (pathname.startsWith('/admin/dashboard')) {
    const authCookie = request.cookies.get('admin-auth')
    
    if (!authCookie || authCookie.value !== 'authenticated') {
      return NextResponse.redirect(new URL('/admin/auth', request.url))
    }
  }

  // Protect user account page
  if (pathname.startsWith('/account')) {
    const authCookie = request.cookies.get('user-auth')
    
    if (!authCookie || authCookie.value !== 'authenticated') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Redirect old login/register pages to new auth page
  if (pathname === '/admin/login' || pathname === '/admin/register') {
    return NextResponse.redirect(new URL('/admin/auth', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/dashboard',
    '/admin/dashboard/:path*',
    '/admin/login',
    '/admin/register',
    '/account',
    '/account/:path*',
  ],
}
