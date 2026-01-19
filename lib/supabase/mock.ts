export type MockUser = {
  id: string
  email: string
  user_metadata: Record<string, any>
}

type MockSession = {
  access_token: string
  token_type: 'bearer'
  expires_at: number
  user: MockUser
}

type MockStore = {
  user: MockUser
  session: MockSession | null
}

const MOCK_STORE_KEY = '__outwitMockSupabaseStore__'

const defaultMetadata = () => {
  const now = new Date()
  const currentMonth = now.toISOString().slice(0, 7)

  return {
    name: 'Demo User',
    full_name: 'Demo User',
    timezone: 'America/New_York',
    currency: 'USD',
    onboarding_done: true,
    onboarding_step: 3,
    notifications: {
      email: true,
      push: true,
      bills: true,
      goals: true,
      budgetAlerts: true,
      overspending: false
    },
    preferences: {
      theme: 'system',
      chartColors: ['#ea580c', '#dc2626', '#059669', '#2563eb', '#7c3aed'],
      dashboardWidgets: ['kpis', 'goals', 'bills', 'activity'],
      reportFrequency: 'monthly'
    },
    recurring_income: [
      {
        id: 'income_paycheck',
        name: 'Monthly Paycheck',
        amount: 4200,
        frequency: 'monthly',
        nextDate: `${currentMonth}-28`,
        active: true
      }
    ],
    accounts: [
      {
        id: 'acct_checking',
        userId: 'mock-user',
        name: 'Everyday Checking',
        type: 'checking',
        balance: 2450,
        currency: 'USD',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      }
    ],
    categories: [
      {
        id: 'cat_rent',
        userId: 'mock-user',
        name: 'Rent',
        groupId: 'group_housing',
        priority: 1,
        rollover: false,
        sortOrder: 1,
        archived: false,
        type: 'expense',
        monthlyBudgetCents: 150000,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      },
      {
        id: 'cat_groceries',
        userId: 'mock-user',
        name: 'Groceries',
        groupId: 'group_essentials',
        priority: 2,
        rollover: true,
        sortOrder: 2,
        archived: false,
        type: 'expense',
        monthlyBudgetCents: 50000,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      }
    ],
    category_groups: [
      {
        id: 'group_housing',
        name: 'Housing',
        type: 'expense',
        sortOrder: 1,
        archived: false
      },
      {
        id: 'group_essentials',
        name: 'Essentials',
        type: 'expense',
        sortOrder: 2,
        archived: false
      }
    ],
    budget_months: [
      {
        id: 'budget_month_current',
        userId: 'mock-user',
        month: currentMonth,
        expectedIncome: 4200,
        readyToAssign: 600,
        totalAssigned: 3600,
        totalSpent: 1800,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      }
    ],
    transactions: [
      {
        id: 'txn_grocery',
        date: `${currentMonth}-12`,
        merchant: 'Green Valley Market',
        description: 'Weekly groceries',
        amount: -126.75,
        type: 'expense',
        accountId: 'acct_checking',
        categoryId: 'cat_groceries',
        budgetMonth: currentMonth,
        note: 'Meal prep supplies',
        userId: 'mock-user',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      }
    ],
    bills: [
      {
        id: 'bill_rent',
        userId: 'mock-user',
        name: 'Rent',
        amount: 1500,
        currency: 'USD',
        categoryId: 'cat_rent',
        accountId: 'acct_checking',
        frequency: 'monthly',
        everyN: 1,
        dayOfMonth: 1,
        dueTime: '09:00',
        timezone: 'America/New_York',
        startsOn: `${currentMonth}-01`,
        autopayEnabled: true,
        autopayGraceDays: 2,
        businessDayRule: 'none',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      }
    ],
    debt_accounts: [
      {
        id: 'debt_card',
        userId: 'mock-user',
        name: 'Everyday Visa',
        type: 'credit_card',
        currency: 'USD',
        principalBalance: 2300,
        apr: 18.9,
        minPayment: 75,
        statementDay: 5,
        dueDay: 25,
        creditLimit: 5000,
        startDate: now.toISOString(),
        timezone: 'America/New_York',
        autopayEnabled: false,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      }
    ],
    goals_v2: [
      {
        id: 'goal_emergency',
        userId: 'mock-user',
        name: 'Emergency Fund',
        priority: 5,
        targetAmount: 5000,
        currency: 'USD',
        targetDate: `${Number(currentMonth.split('-')[0]) + 1}-06-01`,
        status: 'ACTIVE',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      }
    ],
    goal_contributions: [
      {
        id: 'goal_contrib_1',
        userId: 'mock-user',
        goalId: 'goal_emergency',
        amount: 250,
        date: `${currentMonth}-05`
      }
    ],
    investment_accounts: [
      {
        id: 'invest_roth',
        userId: 'mock-user',
        name: 'Roth IRA',
        type: 'retirement',
        currency: 'USD',
        trackHoldings: false,
        currentValue: 12000,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      }
    ],
    investment_plans: [
      {
        id: 'plan_roth',
        userId: 'mock-user',
        accountId: 'invest_roth',
        amount: 200,
        cadence: 'monthly',
        active: true,
        aprAssumption: 7,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      }
    ],
    investment_contributions: [
      {
        id: 'contrib_roth',
        userId: 'mock-user',
        accountId: 'invest_roth',
        amount: 200,
        date: `${currentMonth}-08`,
        currency: 'USD',
        createdAt: now.toISOString()
      }
    ],
    holding_snapshots: [
      {
        id: 'snapshot_roth',
        userId: 'mock-user',
        accountId: 'invest_roth',
        asOf: `${currentMonth}-01`,
        value: 12000,
        currency: 'USD',
        createdAt: now.toISOString()
      }
    ],
    coach_state: {
      current_step: 1,
      completed_steps: [],
      updated_at: now.toISOString()
    },
    coach_messages: []
  }
}

const getMockStore = (): MockStore => {
  if (!globalThis[MOCK_STORE_KEY as keyof typeof globalThis]) {
    const user: MockUser = {
      id: 'mock-user',
      email: 'demo@outwitbudget.com',
      user_metadata: defaultMetadata()
    }

    const session: MockSession = {
      access_token: 'mock-access-token',
      token_type: 'bearer',
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
      user
    }

    globalThis[MOCK_STORE_KEY as keyof typeof globalThis] = {
      user,
      session
    }
  }

  return globalThis[MOCK_STORE_KEY as keyof typeof globalThis] as MockStore
}

const getSession = () => {
  const store = getMockStore()
  return store.session
}

const setSession = (session: MockSession | null) => {
  const store = getMockStore()
  store.session = session
}

const setUserMetadata = (updates: Record<string, any>) => {
  const store = getMockStore()
  store.user = {
    ...store.user,
    user_metadata: {
      ...store.user.user_metadata,
      ...updates
    }
  }
  if (store.session) {
    store.session = {
      ...store.session,
      user: store.user
    }
  }
}

export const createMockSupabaseClient = () => {
  const auth = {
    getUser: async () => ({ data: { user: getMockStore().user }, error: null }),
    getSession: async () => ({ data: { session: getSession() }, error: null }),
    updateUser: async ({ data }: { data: Record<string, any> }) => {
      setUserMetadata(data)
      return { data: { user: getMockStore().user }, error: null }
    },
    signInWithPassword: async ({ email }: { email: string; password: string }) => {
      const store = getMockStore()
      store.user = {
        ...store.user,
        email: email || store.user.email
      }
      const session: MockSession = {
        access_token: 'mock-access-token',
        token_type: 'bearer',
        expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
        user: store.user
      }
      setSession(session)
      return { data: { user: store.user, session }, error: null }
    },
    signUp: async ({ email }: { email: string; password: string }) => {
      const store = getMockStore()
      store.user = {
        ...store.user,
        email: email || store.user.email
      }
      const session: MockSession = {
        access_token: 'mock-access-token',
        token_type: 'bearer',
        expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
        user: store.user
      }
      setSession(session)
      return { data: { user: store.user, session }, error: null }
    },
    resetPasswordForEmail: async () => ({ data: {}, error: null }),
    exchangeCodeForSession: async () => ({ data: { session: getSession() }, error: null }),
    signOut: async () => {
      setSession(null)
      return { error: null }
    },
    onAuthStateChange: (callback: (event: string, session: MockSession | null) => void) => {
      const session = getSession()
      if (typeof window !== 'undefined') {
        window.setTimeout(() => callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session), 0)
      }
      return {
        data: {
          subscription: {
            unsubscribe: () => null
          }
        }
      }
    }
  }

  return { auth }
}
