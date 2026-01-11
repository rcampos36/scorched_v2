import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const usersFilePath = path.join(process.cwd(), 'data', 'users.json')

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
}

async function getUserById(userId: string): Promise<User | null> {
  try {
    if (!(await fs.access(usersFilePath).then(() => true).catch(() => false))) {
      return null
    }
    const fileContents = await fs.readFile(usersFilePath, 'utf8')
    const users = JSON.parse(fileContents)
    const user = users.find((u: any) => u.id === userId)
    
    if (!user) return null
    
    // Return user without password
    const { password, ...userWithoutPassword } = user
    return userWithoutPassword
  } catch (error) {
    return null
  }
}

export async function GET(request: NextRequest) {
  const authCookie = request.cookies.get('user-auth')
  const userIdCookie = request.cookies.get('user-id')
  const emailCookie = request.cookies.get('user-email')
  
  const authenticated = authCookie?.value === 'authenticated'
  
  if (!authenticated || !userIdCookie) {
    return NextResponse.json({ 
      authenticated: false,
      user: null,
    })
  }

  // Fetch full user data
  const user = await getUserById(userIdCookie.value)

  return NextResponse.json({ 
    authenticated: true,
    user: user || {
      id: userIdCookie.value,
      email: emailCookie?.value || null,
    },
  })
}
