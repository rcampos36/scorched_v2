import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'

const usersFilePath = path.join(process.cwd(), 'data', 'users.json')

interface User {
  id: string
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  createdAt: string
}

async function getUsers(): Promise<User[]> {
  try {
    if (!(await fs.access(usersFilePath).then(() => true).catch(() => false))) {
      return []
    }
    const fileContents = await fs.readFile(usersFilePath, 'utf8')
    return JSON.parse(fileContents)
  } catch (error) {
    return []
  }
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const users = await getUsers()
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase())

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const hashedPassword = hashPassword(password)
    if (user.password !== hashedPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Set auth cookies
    const response = NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      }
    })

    response.cookies.set('user-auth', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    response.cookies.set('user-email', user.email, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    response.cookies.set('user-id', user.id, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    )
  }
}
