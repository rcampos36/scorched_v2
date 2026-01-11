import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const dataFilePath = path.join(process.cwd(), 'data', 'header.json')

export async function GET() {
  try {
    const fileContents = await fs.readFile(dataFilePath, 'utf8')
    const data = JSON.parse(fileContents)
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch header data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCookie = request.cookies.get('admin-auth')
    if (!authCookie || authCookie.value !== 'authenticated') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const data = await request.json()

    // Validate data structure
    if (!data.topBar || !data.logo || !data.navigationLinks || !data.ctaButton) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), 'utf8')

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update header data' },
      { status: 500 }
    )
  }
}
