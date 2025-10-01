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
        // Use default cookie storage (not localStorage)
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        sessionRefreshMargin: 60, // Refresh 1 minute before expiry
      }
    }
  )
}
