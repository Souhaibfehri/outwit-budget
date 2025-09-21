import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // This will refresh session if expired - required for Server Components
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (error) {
    // Handle case when Supabase is not configured
    console.log('Supabase not configured, allowing access to public routes')
  }

  // Protect app routes (dashboard, budget, etc.)
  const protectedRoutes = ['/dashboard', '/budget', '/bills', '/debts', '/goals', '/investments', '/reports', '/transactions', '/notifications', '/settings', '/income']
  const isProtectedRoute = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))
  const isOnboardingRoute = request.nextUrl.pathname.startsWith('/onboarding')
  
  if (!user && (isProtectedRoute || isOnboardingRoute)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Handle authenticated users
  if (user) {
    // Redirect away from auth pages
    if (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup') {
      const metadata = user.user_metadata || {}
      const onboardingCompleted = metadata.onboarding_done || metadata.onboarding_session?.completed
      
      const url = request.nextUrl.clone()
      url.pathname = onboardingCompleted ? '/dashboard' : '/onboarding'
      return NextResponse.redirect(url)
    }
    
    // Allow direct access to onboarding for authenticated users
    if (isOnboardingRoute) {
      // Authenticated users can always access onboarding (to redo it if needed)
      return supabaseResponse
    }
    
    // Check if user needs onboarding (accessing protected routes without completing onboarding)
    if (isProtectedRoute) {
      const metadata = user.user_metadata || {}
      const onboardingCompleted = metadata.onboarding_done || metadata.onboarding_session?.completed
      
      if (!onboardingCompleted) {
        const url = request.nextUrl.clone()
        url.pathname = '/onboarding'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}