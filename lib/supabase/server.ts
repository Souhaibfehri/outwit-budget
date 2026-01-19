import { createMockSupabaseClient } from '@/lib/supabase/mock'

export function createClient() {
  return createMockSupabaseClient()
}
