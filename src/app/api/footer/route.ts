import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const dataFilePath = path.join(process.cwd(), 'data', 'footer.json')

export async function GET() {
  try {
    const fileContents = await fs.readFile(dataFilePath, 'utf8')
    const data = JSON.parse(fileContents)
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch footer data' },
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
    if (!data.contact || !data.navigateLinks || !data.companyLinks || !data.additionalLinks || !data.socialMedia || !data.copyright || !data.newsletter) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate socialMedia is an array
    if (!Array.isArray(data.socialMedia)) {
      return NextResponse.json(
        { error: 'socialMedia must be an array' },
        { status: 400 }
      )
    }

    // Validate each social media link has required fields
    for (const social of data.socialMedia) {
      if (!social.name || !social.url || !social.icon) {
        return NextResponse.json(
          { error: 'Each social media link must have name, url, and icon fields' },
          { status: 400 }
        )
      }
    }

    await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), 'utf8')

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update footer data' },
      { status: 500 }
    )
  }
}
