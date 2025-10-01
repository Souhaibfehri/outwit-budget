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
              // Skip ALL Supabase auth cookies to prevent Vercel header size issues
              if (name.includes('supabase') || name.includes('auth') || name.includes('sb-')) {
                console.log(`Skipping Supabase cookie: ${name} (using localStorage instead)`)
                return
              }
              
              // Only set small, essential cookies
              if (value && value.length > 1000) { // Skip any cookie larger than 1KB
                console.warn(`Skipping large cookie: ${name} (${value.length} bytes)`)
                return
              }
              
              // Set minimal cookie options for Vercel compatibility
              const optimizedOptions = {
                ...options,
                maxAge: 1800, // 30 minutes max
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax' as const,
                httpOnly: true,
                path: '/'
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
