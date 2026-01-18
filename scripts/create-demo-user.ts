import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

const prisma = new PrismaClient()

function getEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function buildDemoMetadata(userId: string, demoName: string) {
  const now = new Date()
  const isoNow = now.toISOString()
  const today = isoNow.split('T')[0]
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const categoryGroups = [
    {
      id: 'demo-group-essentials',
      userId,
      name: 'Essentials',
      icon: '🏠',
      sortOrder: 0,
      isDefault: true,
      createdAt: isoNow,
      updatedAt: isoNow
    },
    {
      id: 'demo-group-lifestyle',
      userId,
      name: 'Lifestyle',
      icon: '☕',
      sortOrder: 1,
      isDefault: true,
      createdAt: isoNow,
      updatedAt: isoNow
    },
    {
      id: 'demo-group-savings',
      userId,
      name: 'Savings',
      icon: '💰',
      sortOrder: 2,
      isDefault: true,
      createdAt: isoNow,
      updatedAt: isoNow
    }
  ]

  const categories = [
    {
      id: 'demo-cat-groceries',
      userId,
      name: 'Groceries',
      groupId: 'demo-group-essentials',
      groupName: 'Essentials',
      priority: 1,
      rollover: false,
      sortOrder: 0,
      archived: false,
      type: 'expense',
      monthlyBudgetCents: 45000,
      createdAt: isoNow,
      updatedAt: isoNow
    },
    {
      id: 'demo-cat-rent',
      userId,
      name: 'Rent',
      groupId: 'demo-group-essentials',
      groupName: 'Essentials',
      priority: 1,
      rollover: false,
      sortOrder: 1,
      archived: false,
      type: 'expense',
      monthlyBudgetCents: 165000,
      createdAt: isoNow,
      updatedAt: isoNow
    },
    {
      id: 'demo-cat-entertainment',
      userId,
      name: 'Entertainment',
      groupId: 'demo-group-lifestyle',
      groupName: 'Lifestyle',
      priority: 3,
      rollover: true,
      sortOrder: 2,
      archived: false,
      type: 'expense',
      monthlyBudgetCents: 12000,
      createdAt: isoNow,
      updatedAt: isoNow
    },
    {
      id: 'demo-cat-emergency',
      userId,
      name: 'Emergency Fund',
      groupId: 'demo-group-savings',
      groupName: 'Savings',
      priority: 1,
      rollover: true,
      sortOrder: 3,
      archived: false,
      type: 'expense',
      monthlyBudgetCents: 30000,
      createdAt: isoNow,
      updatedAt: isoNow
    }
  ]

  const budgetItems = categories.map((category, index) => ({
    id: `demo-budget-item-${index + 1}`,
    userId,
    month: currentMonth,
    categoryId: category.id,
    assigned: Math.round(category.monthlyBudgetCents / 100),
    spent: 0,
    leftoverFromPrev: 0,
    createdAt: isoNow,
    updatedAt: isoNow
  }))

  const budgetMonth = {
    id: 'demo-budget-month',
    userId,
    month: currentMonth,
    expectedIncome: 4500,
    allowOverAssign: false,
    createdAt: isoNow,
    updatedAt: isoNow
  }

  return {
    userId,
    name: demoName,
    onboarding_done: true,
    onboarding_step: 5,
    currency: 'USD',
    pay_schedule: 'MONTHLY',
    user_prefs: {
      userId,
      currency: 'USD',
      timezone: 'UTC',
      theme: 'system',
      softBudgetLimit: false,
      allowRolloverDefault: true
    },
    category_groups: categoryGroups,
    categories,
    budget_items: budgetItems,
    budget_months: [budgetMonth],
    recurring_income: [
      {
        id: 'demo-income-1',
        userId,
        name: 'Primary Paycheck',
        amountCents: 450000,
        schedule: 'MONTHLY',
        nextDate: isoNow,
        active: true,
        createdAt: isoNow,
        updatedAt: isoNow
      }
    ],
    one_off_income: [],
    transactions: [
      {
        id: 'demo-transaction-1',
        amount: 127.5,
        description: 'Green Valley Market',
        category: 'Groceries',
        categoryName: 'Groceries',
        date: isoNow,
        type: 'expense',
        account: 'Checking',
        accountName: 'Checking',
        merchant: 'Green Valley Market'
      },
      {
        id: 'demo-transaction-2',
        amount: 4500,
        description: 'Monthly Salary',
        category: 'Income',
        categoryName: 'Income',
        date: isoNow,
        type: 'income',
        account: 'Checking',
        accountName: 'Checking',
        merchant: 'Acme Corp'
      }
    ],
    bills: [
      {
        id: 'demo-bill-1',
        userId,
        name: 'Rent',
        amount: 1650,
        currency: 'USD',
        categoryId: 'demo-cat-rent',
        frequency: 'monthly',
        dayOfMonth: 1,
        dueTime: '09:00',
        timezone: 'UTC',
        startsOn: today,
        autopayEnabled: true,
        autopayGraceDays: 2,
        businessDayRule: 'none',
        createdAt: isoNow,
        updatedAt: isoNow
      }
    ],
    debt_accounts: [
      {
        id: 'demo-debt-1',
        userId,
        name: 'Rewards Credit Card',
        type: 'credit_card',
        currency: 'USD',
        principalBalance: 1240,
        apr: 18.9,
        minPayment: 45,
        statementDay: 15,
        dueDay: 1,
        creditLimit: 5000,
        startDate: isoNow,
        timezone: 'UTC',
        autopayEnabled: false,
        createdAt: isoNow,
        updatedAt: isoNow
      }
    ],
    goals_v2: [
      {
        id: 'demo-goal-1',
        userId,
        name: 'Emergency Fund',
        priority: 1,
        targetAmount: 5000,
        currency: 'USD',
        targetDate: `${now.getFullYear() + 1}-12-31`,
        notifyEnabled: true,
        notifyRules: {
          daysBefore: [30, 7],
          offPace: true,
          milestone: [25, 50, 75, 100]
        },
        status: 'ACTIVE',
        createdAt: isoNow,
        updatedAt: isoNow
      }
    ],
    goal_contributions: [
      {
        id: 'demo-goal-contribution-1',
        goalId: 'demo-goal-1',
        userId,
        date: isoNow,
        amount: 750,
        source: 'RTA',
        createdAt: isoNow
      }
    ],
    investment_accounts: [
      {
        id: 'demo-investment-1',
        userId,
        name: 'Roth IRA',
        type: 'retirement',
        currency: 'USD',
        balance: 8200,
        monthlyContribution: 250,
        expectedReturn: 0.07,
        riskLevel: 'moderate',
        createdAt: isoNow,
        updatedAt: isoNow
      }
    ]
  }
}

async function main() {
  const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL')
  const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')

  const demoEmail = process.env.DEMO_USER_EMAIL || 'demo@outwitbudget.com'
  const demoPassword = process.env.DEMO_USER_PASSWORD || 'DemoPass!123'
  const demoName = process.env.DEMO_USER_NAME || 'Demo User'
  const resetPassword = process.env.DEMO_USER_RESET_PASSWORD === 'true'

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  const { data: userList, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200
  })

  if (listError) {
    throw new Error(`Failed to list users: ${listError.message}`)
  }

  const existingUser = userList.users.find(user => user.email?.toLowerCase() === demoEmail.toLowerCase())
  let userId = existingUser?.id

  if (!existingUser) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: demoEmail,
      password: demoPassword,
      email_confirm: true,
      user_metadata: {
        name: demoName,
        onboarding_done: true,
        onboarding_step: 5,
        currency: 'USD',
        pay_schedule: 'MONTHLY'
      }
    })

    if (error || !data.user) {
      throw new Error(`Failed to create demo user: ${error?.message ?? 'unknown error'}`)
    }

    userId = data.user.id
  }

  if (!userId) {
    throw new Error('Demo user ID was not resolved')
  }

  const metadata = buildDemoMetadata(userId, demoName)

  if (existingUser) {
    const updatePayload: Record<string, unknown> = {
      email: demoEmail,
      user_metadata: metadata
    }

    if (resetPassword) {
      updatePayload.password = demoPassword
    }

    const { error } = await supabase.auth.admin.updateUserById(existingUser.id, updatePayload)

    if (error) {
      throw new Error(`Failed to update demo user: ${error.message}`)
    }
  } else {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: metadata
    })

    if (error) {
      throw new Error(`Failed to update demo user metadata: ${error.message}`)
    }
  }

  await prisma.user.upsert({
    where: { id: userId },
    update: {
      email: demoEmail,
      name: demoName
    },
    create: {
      id: userId,
      email: demoEmail,
      name: demoName
    }
  })

  await prisma.userProfile.upsert({
    where: { userId },
    update: {
      displayName: demoName,
      onboardingDone: true,
      onboardingStep: 5,
      currency: 'USD',
      timezone: 'UTC'
    },
    create: {
      userId,
      displayName: demoName,
      onboardingDone: true,
      onboardingStep: 5,
      currency: 'USD',
      timezone: 'UTC'
    }
  })

  await prisma.userPrefs.upsert({
    where: { userId },
    update: {
      currency: 'USD',
      timezone: 'UTC',
      theme: 'system',
      softBudgetLimit: false,
      allowRolloverDefault: true
    },
    create: {
      userId,
      currency: 'USD',
      timezone: 'UTC',
      theme: 'system',
      softBudgetLimit: false,
      allowRolloverDefault: true
    }
  })

  console.log('✅ Demo user is ready:')
  console.log(`   Email: ${demoEmail}`)
  console.log(`   Password: ${demoPassword}`)
  console.log(`   User ID: ${userId}`)
}

main()
  .catch((error) => {
    console.error('❌ Failed to create demo user:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
