import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authCookie = request.cookies.get('admin-auth')
    if (!authCookie || authCookie.value !== 'authenticated') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Return only the admin account info
    return NextResponse.json({ 
      admins: [{
        id: 1,
        email: 'rcrogercampos@gmail.com',
        name: 'Admin',
      }]
    })
  } catch (error) {
    console.error('Error fetching admins:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admins' },
      { status: 500 }
    )
  }
}
