import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ success: true })

  // Clear user auth cookies
  response.cookies.delete('user-auth')
  response.cookies.delete('user-email')
  response.cookies.delete('user-id')

  return response
}
