import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const subscriptionsFilePath = path.join(process.cwd(), 'data', 'newsletter-subscriptions.json')

// Initialize file if it doesn't exist
async function ensureSubscriptionsFile() {
  try {
    await fs.access(subscriptionsFilePath)
  } catch {
    // File doesn't exist, create it with empty array
    await fs.writeFile(subscriptionsFilePath, JSON.stringify([], null, 2), 'utf8')
  }
}

export async function GET() {
  try {
    await ensureSubscriptionsFile()

    // Read existing subscriptions
    const fileContents = await fs.readFile(subscriptionsFilePath, 'utf8')
    const subscriptions = JSON.parse(fileContents)

    return NextResponse.json({ 
      success: true, 
      subscriptions 
    })
  } catch (error) {
    console.error('Error fetching newsletter subscriptions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch newsletter subscriptions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureSubscriptionsFile()

    const body = await request.json()
    const { email } = body

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }

    // Read existing subscriptions
    const fileContents = await fs.readFile(subscriptionsFilePath, 'utf8')
    const subscriptions = JSON.parse(fileContents)

    // Check if email already exists
    if (subscriptions.some((sub: { email: string; subscribedAt: string }) => sub.email.toLowerCase() === email.toLowerCase())) {
      return NextResponse.json(
        { error: 'This email is already subscribed' },
        { status: 400 }
      )
    }

    // Add new subscription
    const newSubscription = {
      email: email.toLowerCase(),
      subscribedAt: new Date().toISOString()
    }

    subscriptions.push(newSubscription)

    // Save updated subscriptions
    await fs.writeFile(subscriptionsFilePath, JSON.stringify(subscriptions, null, 2), 'utf8')

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully subscribed to newsletter' 
    })
  } catch (error) {
    console.error('Newsletter subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to subscribe to newsletter' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await ensureSubscriptionsFile()

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }

    // Read existing subscriptions
    const fileContents = await fs.readFile(subscriptionsFilePath, 'utf8')
    const subscriptions = JSON.parse(fileContents)

    // Find and remove the subscription
    const initialLength = subscriptions.length
    const filteredSubscriptions = subscriptions.filter(
      (sub: { email: string; subscribedAt: string }) => sub.email.toLowerCase() !== email.toLowerCase()
    )

    if (filteredSubscriptions.length === initialLength) {
      return NextResponse.json(
        { error: 'Email not found in subscriptions' },
        { status: 404 }
      )
    }

    // Save updated subscriptions
    await fs.writeFile(subscriptionsFilePath, JSON.stringify(filteredSubscriptions, null, 2), 'utf8')

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully unsubscribed email' 
    })
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error)
    return NextResponse.json(
      { error: 'Failed to unsubscribe email' },
      { status: 500 }
    )
  }
}
