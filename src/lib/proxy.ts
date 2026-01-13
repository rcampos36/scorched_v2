/**
 * Utility function to make requests through the proxy API
 * This bypasses CORS restrictions by routing requests through the Next.js server
 * 
 * @param url - The full URL to proxy (e.g., 'https://secdomcheck.online/alk/g2.php')
 * @param options - Fetch options (method, body, headers, etc.)
 * @returns Promise<Response>
 */
export async function fetchViaProxy(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Extract the path from the URL to determine which proxy route to use
  const urlObj = new URL(url)
  
  // For secdomcheck.online, use the specific proxy route
  if (urlObj.hostname === 'secdomcheck.online') {
    const proxyUrl = `/api/proxy/secdomcheck${urlObj.pathname}${urlObj.search}`
    
    return fetch(proxyUrl, {
      ...options,
      method: options.method || 'GET',
    })
  }
  
  // For other URLs, you can add more proxy routes as needed
  // For now, throw an error for unsupported domains
  throw new Error(`Proxy not configured for domain: ${urlObj.hostname}`)
}

/**
 * Specific helper for secdomcheck.online API calls
 */
export async function fetchSecdomCheck(
  path: string = '/alk/g2.php',
  options: RequestInit = {}
): Promise<Response> {
  const searchParams = new URLSearchParams()
  if (options.method === 'GET' && options.body) {
    // If it's a GET request with body, convert to query params
    // This is a workaround - ideally use query params for GET
    console.warn('GET requests should not have a body. Consider using query parameters instead.')
  }
  
  const queryString = searchParams.toString()
  const proxyUrl = `/api/proxy/secdomcheck${path}${queryString ? `?${queryString}` : ''}`
  
  return fetch(proxyUrl, {
    ...options,
    method: options.method || 'GET',
  })
}
