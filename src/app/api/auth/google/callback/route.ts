import { NextRequest, NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'
import { isAdminEmail } from '@/lib/auth'

const ADMIN_EMAIL = 'rcrogercampos@gmail.com'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { credential } = body

    if (!credential) {
      return NextResponse.json(
        { error: 'No credential provided' },
        { status: 400 }
      )
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      return NextResponse.json(
        { error: 'Google OAuth not configured' },
        { status: 500 }
      )
    }

    // Verify the token
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const { email, name } = payload

    if (!email) {
      return NextResponse.json(
        { error: 'Email not provided by Google' },
        { status: 400 }
      )
    }

    // Verify email matches admin email
    if (!isAdminEmail(email)) {
      return NextResponse.json(
        { error: 'Unauthorized. Only authorized accounts can access.' },
        { status: 403 }
      )
    }

    // Set auth cookie with email
    const response = NextResponse.json({ 
      success: true, 
      admin: {
        id: 1,
        email: ADMIN_EMAIL,
        name: name || 'Admin',
      }
    })

    response.cookies.set('admin-auth', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    response.cookies.set('admin-email', email, {
      httpOnly: false, // Allow client to read for display
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    console.error('Google OAuth error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}
