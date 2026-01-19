import { createMockSupabaseClient } from '@/lib/supabase/mock'

export function createLocalStorageClient() {
  return createMockSupabaseClient()
}
