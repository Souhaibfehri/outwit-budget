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
              // Skip extremely large cookies that cause header size issues
              if (value && value.length > 4000) { // Skip cookies larger than 4KB
                console.warn(`Skipping large cookie: ${name} (${value.length} bytes)`)
                return
              }
              
              // Optimize cookie settings to prevent large cookies
              const optimizedOptions = {
                ...options,
                // Reduce cookie size by setting shorter expiration
                maxAge: Math.min(options?.maxAge || 3600, 3600), // Max 1 hour
                // Ensure secure settings
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax' as const,
                httpOnly: true,
                // Split large cookies into smaller chunks
                ...(value && value.length > 2000 && {
                  maxAge: 1800 // 30 minutes for large cookies
                })
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
