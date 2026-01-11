// Hardcoded admin account
const ADMIN_EMAIL = 'rcrogercampos@gmail.com'
const ADMIN_PASSWORD = 'Rr12121331122!!'

export interface Admin {
  id: number
  email: string
  name: string
}

// Verify credentials against hardcoded admin account
export async function verifyCredentials(email: string, password: string): Promise<{ success: boolean; admin?: Admin }> {
  // Check against hardcoded credentials
  if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD) {
    return {
      success: true,
      admin: {
        id: 1,
        email: ADMIN_EMAIL,
        name: 'Admin',
      },
    }
  }

  return { success: false }
}

// Verify if email matches admin email (for Google OAuth)
export function isAdminEmail(email: string): boolean {
  return email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
}

