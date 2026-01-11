import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // Registration is disabled - only one hardcoded admin account exists
  return NextResponse.json(
    { error: 'Registration is not available. Only authorized accounts can access.' },
    { status: 403 }
  )
}
