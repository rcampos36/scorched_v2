import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const authCookie = request.cookies.get('admin-auth')
  const emailCookie = request.cookies.get('admin-email')
  const authenticated = authCookie?.value === 'authenticated'
  
  return NextResponse.json({ 
    authenticated,
    email: emailCookie?.value || null,
  })
}
