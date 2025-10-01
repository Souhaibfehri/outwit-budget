import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  // Provide fallback values for build time
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Handle Supabase auth cookies properly
              if (name.includes('supabase') || name.includes('auth') || name.includes('sb-')) {
                // Set proper auth cookie options
                const authCookieOptions = {
                  ...options,
                  secure: process.env.NODE_ENV === 'production',
                  sameSite: 'lax' as const,
                  httpOnly: true,
                  path: '/',
                  // Allow auth cookies to persist properly
                  maxAge: options?.maxAge || 60 * 60 * 24 * 7, // 7 days default
                }
                cookieStore.set(name, value, authCookieOptions)
                return
              }
              
              // For other cookies, apply size limits
              if (value && value.length > 4000) {
                console.warn(`Skipping large cookie: ${name} (${value.length} bytes)`)
                return
              }
              
              // Set optimized cookie options for other cookies
              const optimizedOptions = {
                ...options,
                maxAge: Math.min(options?.maxAge || 3600, 3600), // Max 1 hour for non-auth
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax' as const,
                httpOnly: true
              }
              cookieStore.set(name, value, optimizedOptions)
            })
          } catch (error) {
            console.error('Cookie setting error:', error)
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
