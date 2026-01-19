import { NextRequest, NextResponse } from 'next/server'
import { getJsonDataFallback, saveJsonDataFallback } from '@/lib/json-storage'

const BLOB_PATH = 'data/newsletter-subscriptions.json'
const LOCAL_FILE_PATH = 'data/newsletter-subscriptions.json'

interface NewsletterSubscription {
  email: string
  subscribedAt: string
}

// Disable Next.js caching for this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    // Read subscriptions from blob storage (with local fallback)
    const subscriptions = await getJsonDataFallback<NewsletterSubscription[]>(BLOB_PATH, LOCAL_FILE_PATH)

    return NextResponse.json({ 
      success: true, 
      subscriptions: subscriptions || [] 
    })
  } catch (error: any) {
    console.error('Error fetching newsletter subscriptions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch newsletter subscriptions', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }

    // Read existing subscriptions from blob storage (with local fallback)
    const subscriptions = await getJsonDataFallback<NewsletterSubscription[]>(BLOB_PATH, LOCAL_FILE_PATH) || []

    // Check if email already exists
    if (subscriptions.some((sub) => sub.email.toLowerCase() === email.toLowerCase())) {
      return NextResponse.json(
        { error: 'This email is already subscribed' },
        { status: 400 }
      )
    }

    // Add new subscription
    const newSubscription: NewsletterSubscription = {
      email: email.toLowerCase(),
      subscribedAt: new Date().toISOString()
    }

    subscriptions.push(newSubscription)

    // Save updated subscriptions to blob storage (with local fallback)
    await saveJsonDataFallback(BLOB_PATH, LOCAL_FILE_PATH, subscriptions)

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully subscribed to newsletter' 
    })
  } catch (error: any) {
    console.error('Newsletter subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to subscribe to newsletter', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }

    // Read existing subscriptions from blob storage (with local fallback)
    const subscriptions = await getJsonDataFallback<NewsletterSubscription[]>(BLOB_PATH, LOCAL_FILE_PATH) || []

    // Find and remove the subscription
    const initialLength = subscriptions.length
    const filteredSubscriptions = subscriptions.filter(
      (sub) => sub.email.toLowerCase() !== email.toLowerCase()
    )

    if (filteredSubscriptions.length === initialLength) {
      return NextResponse.json(
        { error: 'Email not found in subscriptions' },
        { status: 404 }
      )
    }

    // Save updated subscriptions to blob storage (with local fallback)
    await saveJsonDataFallback(BLOB_PATH, LOCAL_FILE_PATH, filteredSubscriptions)

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully unsubscribed email' 
    })
  } catch (error: any) {
    console.error('Newsletter unsubscribe error:', error)
    return NextResponse.json(
      { error: 'Failed to unsubscribe email', details: error.message },
      { status: 500 }
    )
  }
}
