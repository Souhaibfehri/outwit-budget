type QueryResult<T> = { data: T | null; error: null }
type QueryListResult<T> = { data: T[]; error: null }

const emptyObjectResult = <T>(): QueryResult<T> => ({ data: null, error: null })
const emptyListResult = <T>(): QueryListResult<T> => ({ data: [], error: null })

const createQueryBuilder = () => ({
  select: async <T = unknown>() => emptyListResult<T>(),
  insert: async <T = unknown>() => emptyListResult<T>(),
  update: async <T = unknown>() => emptyListResult<T>(),
  delete: async <T = unknown>() => emptyListResult<T>(),
  upsert: async <T = unknown>() => emptyListResult<T>(),
  eq: () => createQueryBuilder(),
  neq: () => createQueryBuilder(),
  gt: () => createQueryBuilder(),
  gte: () => createQueryBuilder(),
  lt: () => createQueryBuilder(),
  lte: () => createQueryBuilder(),
  order: () => createQueryBuilder(),
  limit: () => createQueryBuilder(),
  single: async <T = unknown>() => emptyObjectResult<T>(),
  maybeSingle: async <T = unknown>() => emptyObjectResult<T>(),
})

export const isSupabaseDisabled = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return (
    !supabaseUrl ||
    !supabaseKey ||
    supabaseUrl === 'https://placeholder.supabase.co' ||
    supabaseKey === 'placeholder-key'
  )
}

export const createFallbackClient = () => ({
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    signInWithPassword: async () => ({ data: { user: null, session: null }, error: null }),
    signUp: async () => ({ data: { user: null, session: null }, error: null }),
    updateUser: async () => ({ data: { user: null }, error: null }),
    resetPasswordForEmail: async () => ({ data: {}, error: null }),
    exchangeCodeForSession: async () => ({ data: { user: null, session: null }, error: null }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({
      data: {
        subscription: {
          unsubscribe: () => undefined,
        },
      },
    }),
  },
  from: () => createQueryBuilder(),
  rpc: async <T = unknown>() => emptyObjectResult<T>(),
})
