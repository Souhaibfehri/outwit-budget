import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // EMERGENCY: Ultra-minimal middleware to bypass header size issues
  // NO Supabase calls, NO auth checks - just basic routing
  
  try {
    // Always allow fix pages
    const emergencyPaths = [
      '/fix-now', '/fix-headers', '/fix', '/migrate', '/migrate-simple',
      '/debug', '/error', '/emergency', '/clear-data', '/clear-cookies'
    ]
    
    // Check if this is an emergency fix path
    const isEmergencyPath = emergencyPaths.some(path => pathname.startsWith(path))
    if (isEmergencyPath) {
      return NextResponse.next()
    }

    // Always allow static assets and API routes
    const staticPaths = [
      '/_next', '/favicon.ico', '/api', '/auth/callback'
    ]
    
    const isStaticPath = staticPaths.some(path => pathname.startsWith(path))
    if (isStaticPath) {
      return NextResponse.next()
    }

    // For login/signup, allow without checks
    if (pathname === '/login' || pathname === '/signup' || pathname === '/') {
      return NextResponse.next()
    }

    // For ALL other paths (dashboard, etc.), redirect to appropriate fix page if headers might be too large
    const userAgent = request.headers.get('user-agent') || ''
    const cookies = request.headers.get('cookie') || ''
    const authorization = request.headers.get('authorization') || ''
    
    // Analyze what's causing the size issue
    const cookiesSize = cookies.length
    const userAgentSize = userAgent.length
    const authSize = authorization.length
    const estimatedOtherHeaders = 2000 // Accept, Content-Type, etc.
    
    const totalEstimated = cookiesSize + userAgentSize + authSize + estimatedOtherHeaders
    
    // If headers exceed safe limit, redirect to appropriate fix
    if (totalEstimated > 12000) { // Conservative 12KB limit
      // If cookies are the main problem, redirect to cookie clearing
      if (cookiesSize > 6000) { // Cookies are >6KB
        return NextResponse.redirect(new URL('/clear-cookies', request.url))
      } else {
        // Otherwise, redirect to metadata fix
        return NextResponse.redirect(new URL('/fix-now', request.url))
      }
    }

    // Otherwise, allow the request
    return NextResponse.next()
    
  } catch (error) {
    console.error('Middleware error:', error)
    
    // On any error, redirect to fix page instead of failing
    return NextResponse.redirect(new URL('/fix-now', request.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}