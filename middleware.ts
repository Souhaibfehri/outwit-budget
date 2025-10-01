import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  try {
    // Always allow these paths without auth checks
    const publicPaths = [
      '/', '/login', '/signup', '/auth/callback',
      '/fix-now', '/fix-headers', '/fix', '/migrate', '/migrate-simple',
      '/debug', '/error', '/emergency', '/clear-data', '/clear-cookies'
    ]
    
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
    if (isPublicPath) {
      return NextResponse.next()
    }

    // Always allow static assets and API routes
    const staticPaths = ['/_next', '/favicon.ico', '/api']
    const isStaticPath = staticPaths.some(path => pathname.startsWith(path))
    if (isStaticPath) {
      return NextResponse.next()
    }

    // Create Supabase client for auth check
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
              supabaseResponse.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    // Check if user is authenticated
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      // Not authenticated - redirect to login
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // User is authenticated - allow request
    return supabaseResponse

  } catch (error) {
    console.error('Middleware error:', error)
    
    // On any error, redirect to login instead of failing
    return NextResponse.redirect(new URL('/login', request.url))
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