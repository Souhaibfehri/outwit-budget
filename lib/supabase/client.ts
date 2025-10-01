import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Provide fallback values for build time
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

  return createBrowserClient(
    supabaseUrl,
    supabaseKey,
    {
      auth: {
        // Optimize auth settings to prevent large cookies
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        // Reduce cookie size by limiting storage
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        // Shorter session duration to prevent large cookies
        sessionRefreshMargin: 60, // Refresh 1 minute before expiry
      },
      // Global settings to reduce payload size
      global: {
        headers: {
          'X-Client-Info': 'outwit-budget'
        }
      }
    }
  )
}
