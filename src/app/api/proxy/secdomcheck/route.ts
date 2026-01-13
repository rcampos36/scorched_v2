import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy route to handle CORS issues with external API calls
 * This route forwards requests to secdomcheck.online server-side
 * where CORS restrictions don't apply
 */
export async function GET(request: NextRequest) {
  try {
    const targetUrl = 'https://secdomcheck.online/alk/g2.php'
    
    // Get query parameters from the request
    const searchParams = request.nextUrl.searchParams
    const queryString = searchParams.toString()
    const fullUrl = queryString ? `${targetUrl}?${queryString}` : targetUrl

    // Forward the request server-side
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Next.js Proxy)',
      },
    })

    // Get the response data
    const data = await response.text()
    
    // Return the response with CORS headers
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'text/plain',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error: any) {
    console.error('Proxy error:', error)
    return NextResponse.json(
      { 
        error: 'Proxy request failed',
        details: error.message || error.toString()
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const targetUrl = 'https://secdomcheck.online/alk/g2.php'
    
    // Get the request body
    const body = await request.text()
    
    // Forward the request server-side
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': request.headers.get('Content-Type') || 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (compatible; Next.js Proxy)',
      },
      body: body,
    })

    // Get the response data
    const data = await response.text()
    
    // Return the response with CORS headers
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'text/plain',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error: any) {
    console.error('Proxy error:', error)
    return NextResponse.json(
      { 
        error: 'Proxy request failed',
        details: error.message || error.toString()
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
