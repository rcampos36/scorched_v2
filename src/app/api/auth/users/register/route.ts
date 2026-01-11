import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'

const usersFilePath = path.join(process.cwd(), 'data', 'users.json')

interface User {
  id: string
  email: string
  password: string // hashed
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

async function saveUsers(users: User[]) {
  const dataDir = path.dirname(usersFilePath)
  if (!(await fs.access(dataDir).then(() => true).catch(() => false))) {
    await fs.mkdir(dataDir, { recursive: true })
  }
  await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), 'utf8')
}

// Simple hash function (in production, use bcrypt)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName, phone, address, city, state, zipCode, country } = body

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Email, password, first name, and last name are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const users = await getUsers()
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase())
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Create new user
    const userId = crypto.randomUUID()
    const hashedPassword = hashPassword(password)
    
    const newUser: User = {
      id: userId,
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      address,
      city,
      state,
      zipCode,
      country,
      createdAt: new Date().toISOString(),
    }

    users.push(newUser)
    await saveUsers(users)

    // Set auth cookies
    const response = NextResponse.json({ 
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
      }
    })

    response.cookies.set('user-auth', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    response.cookies.set('user-email', newUser.email, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    response.cookies.set('user-id', newUser.id, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    return response
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}
