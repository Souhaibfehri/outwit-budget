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
              // Skip large cookies that cause header size issues
              if (value && value.length > 3000) {
                console.warn(`Skipping large cookie: ${name} (${value.length} bytes) - causes header size issues`)
                return
              }
              
              // Handle Supabase auth cookies with minimal size
              if (name.includes('supabase') || name.includes('auth') || name.includes('sb-')) {
                // Use minimal cookie options for auth
                const authCookieOptions = {
                  ...options,
                  secure: process.env.NODE_ENV === 'production',
                  sameSite: 'lax' as const,
                  httpOnly: true,
                  path: '/',
                  // Shorter maxAge to reduce persistence issues
                  maxAge: Math.min(options?.maxAge || 3600, 3600), // Max 1 hour
                }
                cookieStore.set(name, value, authCookieOptions)
                return
              }
              
              // For other cookies, apply strict size limits
              if (value && value.length > 2000) {
                console.warn(`Skipping large non-auth cookie: ${name} (${value.length} bytes)`)
                return
              }
              
              // Set optimized cookie options for other cookies
              const optimizedOptions = {
                ...options,
                maxAge: Math.min(options?.maxAge || 1800, 1800), // Max 30 minutes for non-auth
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
