import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Simple routing without complex auth logic
  // This prevents middleware invocation failures
  
  try {
    // Always allow public paths
    const publicPaths = [
      '/', '/login', '/signup', '/migrate', '/debug', '/error',
      '/api', '/_next', '/favicon.ico'
    ]
    
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
    
    if (isPublicPath) {
      return NextResponse.next()
    }

    // For protected routes, just continue without complex auth
    // Let the pages handle authentication themselves
    return NextResponse.next()
    
  } catch (error) {
    console.error('Middleware error:', error)
    
    // Always allow the request to continue to prevent app breakage
    return NextResponse.next()
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
