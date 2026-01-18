import { createBrowserClient } from '@supabase/ssr'
import { createFallbackClient, isSupabaseDisabled } from './fallback-client'

export function createClient() {
  // Provide fallback values for build time
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

  if (isSupabaseDisabled()) {
    return createFallbackClient()
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseKey,
    {
      auth: {
        // Optimize auth settings to minimize cookie size
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        sessionRefreshMargin: 300, // Refresh 5 minutes before expiry (longer margin)
        flowType: 'pkce', // Use PKCE flow which is more secure and can use smaller tokens
        
        // Custom storage to control cookie size
        storage: typeof window !== 'undefined' ? {
          getItem: (key: string) => {
            try {
              // Try localStorage first for smaller storage
              return window.localStorage.getItem(key)
            } catch {
              return null
            }
          },
          setItem: (key: string, value: string) => {
            try {
              // Store in localStorage instead of cookies to avoid size limits
              window.localStorage.setItem(key, value)
            } catch (error) {
              console.warn('Storage error:', error)
            }
          },
          removeItem: (key: string) => {
            try {
              window.localStorage.removeItem(key)
            } catch (error) {
              console.warn('Storage error:', error)
            }
          }
        } : undefined,
      },
      
      // Global settings to minimize payload
      global: {
        headers: {
          'X-Client-Info': 'outwit-budget-optimized'
        }
      }
    }
  )
}
