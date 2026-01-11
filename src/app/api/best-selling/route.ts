import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const dataFilePath = path.join(process.cwd(), 'data', 'best-selling.json')

export async function GET() {
  try {
    const fileContents = await fs.readFile(dataFilePath, 'utf8')
    const data = JSON.parse(fileContents)
    
    // Handle legacy format (array) by converting to new format
    if (Array.isArray(data)) {
      return NextResponse.json({
        sectionHeading: "OUR BEST-SELLING SHIRTS. JUMP RIGHT IN.",
        sectionSubtitle: "Get started with one of our best-selling favorites.",
        products: data
      })
    }
    
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch best-selling products' },
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
    if (!data.sectionHeading || !data.sectionSubtitle || !Array.isArray(data.products)) {
      return NextResponse.json(
        { error: 'Data must have sectionHeading, sectionSubtitle, and products array' },
        { status: 400 }
      )
    }

    // Validate each product has required fields
    for (const product of data.products) {
      if (!product.id || !product.image || !product.title || !product.description) {
        return NextResponse.json(
          { error: 'Each product must have id, image, title, and description' },
          { status: 400 }
        )
      }
    }

    await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), 'utf8')

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update best-selling products' },
      { status: 500 }
    )
  }
}
