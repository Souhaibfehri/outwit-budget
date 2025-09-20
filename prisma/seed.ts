// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: 'demo@outwitbudget.com' },
    update: {},
    create: {
      email: 'demo@outwitbudget.com',
      name: 'Demo User',
    },
  });

  // Create user profile
  await prisma.userProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      onboardingDone: true,
      currency: 'USD',
      paySchedule: 'MONTHLY',
      baseTakeHome: 500000, // $5,000 in cents
      nextPayDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
      country: 'US',
    },
  });

  // Create categories
  const categories = [
    // Expense categories
    { name: 'Bills & Utilities', groupName: 'Fixed Expenses', type: 'expense' },
    { name: 'Groceries', groupName: 'Food', type: 'expense' },
    { name: 'Transport', groupName: 'Transportation', type: 'expense' },
    { name: 'Food & Dining', groupName: 'Food', type: 'expense' },
    { name: 'Shopping', groupName: 'Lifestyle', type: 'expense' },
    { name: 'Entertainment', groupName: 'Lifestyle', type: 'expense' },
    { name: 'Healthcare', groupName: 'Health', type: 'expense' },
    { name: 'Subscriptions', groupName: 'Fixed Expenses', type: 'expense' },
    // Income categories
    { name: 'Salary', groupName: 'Employment', type: 'income' },
    { name: 'Freelance', groupName: 'Employment', type: 'income' },
    { name: 'Investments', groupName: 'Passive Income', type: 'income' },
  ];

  const createdCategories = [];
  for (const category of categories) {
    const created = await prisma.category.upsert({
      where: { 
        userId_name: {
          userId: user.id,
          name: category.name
        }
      },
      update: {},
      create: {
        ...category,
        userId: user.id,
      },
    });
    createdCategories.push(created);
  }

  // Create accounts
  const checkingAccount = await prisma.account.upsert({
    where: { id: 'demo-checking' },
    update: {},
    create: {
      id: 'demo-checking',
      name: 'Main Checking',
      type: 'checking',
      balanceCents: 525000, // $5,250
      userId: user.id,
    },
  });

  const creditCard = await prisma.account.upsert({
    where: { id: 'demo-credit' },
    update: {},
    create: {
      id: 'demo-credit',
      name: 'Rewards Card',
      type: 'credit',
      balanceCents: -125000, // -$1,250 (credit card debt)
      userId: user.id,
    },
  });

  const savingsAccount = await prisma.account.upsert({
    where: { id: 'demo-savings' },
    update: {},
    create: {
      id: 'demo-savings',
      name: 'Emergency Fund',
      type: 'savings',
      balanceCents: 1000000, // $10,000
      userId: user.id,
    },
  });

  // Create sample transactions
  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const sampleTransactions = [
    // Income
    {
      merchant: 'Monthly Salary',
      amountCents: 500000,
      type: 'INCOME',
      date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
      accountId: checkingAccount.id,
      categoryId: createdCategories.find(c => c.name === 'Salary')?.id,
    },
    // Expenses
    {
      merchant: 'Rent Payment',
      amountCents: 120000,
      type: 'EXPENSE',
      date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
      accountId: checkingAccount.id,
      categoryId: createdCategories.find(c => c.name === 'Bills & Utilities')?.id,
    },
    {
      merchant: 'Electric Company',
      amountCents: 12000,
      type: 'EXPENSE',
      date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 5),
      accountId: checkingAccount.id,
      categoryId: createdCategories.find(c => c.name === 'Bills & Utilities')?.id,
    },
    {
      merchant: 'Whole Foods',
      amountCents: 35000,
      type: 'EXPENSE',
      date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 7),
      accountId: creditCard.id,
      categoryId: createdCategories.find(c => c.name === 'Groceries')?.id,
    },
    {
      merchant: 'Shell Gas Station',
      amountCents: 4500,
      type: 'EXPENSE',
      date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 8),
      accountId: creditCard.id,
      categoryId: createdCategories.find(c => c.name === 'Transport')?.id,
    },
    {
      merchant: 'Netflix',
      amountCents: 1599,
      type: 'EXPENSE',
      date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 12),
      accountId: creditCard.id,
      categoryId: createdCategories.find(c => c.name === 'Subscriptions')?.id,
    },
  ];

  // Create transactions
  for (const transaction of sampleTransactions) {
    await prisma.transaction.upsert({
      where: { id: `demo-${transaction.merchant.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: {
        id: `demo-${transaction.merchant.toLowerCase().replace(/\s+/g, '-')}`,
        ...transaction,
        userId: user.id,
      },
    });
  }

  // Create budget entries for current month
  const expenseCategories = createdCategories.filter(c => c.type === 'expense');
  const budgetAllocations = [
    { categoryName: 'Bills & Utilities', assignedCents: 160000 },
    { categoryName: 'Groceries', assignedCents: 50000 },
    { categoryName: 'Transport', assignedCents: 20000 },
    { categoryName: 'Food & Dining', assignedCents: 30000 },
    { categoryName: 'Shopping', assignedCents: 20000 },
    { categoryName: 'Entertainment', assignedCents: 15000 },
    { categoryName: 'Healthcare', assignedCents: 10000 },
    { categoryName: 'Subscriptions', assignedCents: 5000 },
  ];

  for (const allocation of budgetAllocations) {
    const category = createdCategories.find(c => c.name === allocation.categoryName);
    if (category) {
      await prisma.budgetEntry.upsert({
        where: {
          userId_year_month_categoryId: {
            userId: user.id,
            year: currentMonth.getFullYear(),
            month: currentMonth.getMonth() + 1,
            categoryId: category.id,
          }
        },
        update: {},
        create: {
          userId: user.id,
          year: currentMonth.getFullYear(),
          month: currentMonth.getMonth() + 1,
          categoryId: category.id,
          assignedCents: allocation.assignedCents,
          spentCents: 0, // Will be calculated from transactions
        },
      });
    }
  }

  // Create debts
  await prisma.debt.upsert({
    where: { id: 'demo-student-loan' },
    update: {},
    create: {
      id: 'demo-student-loan',
      userId: user.id,
      name: 'Student Loan',
      balanceCents: 2500000, // $25,000
      rate: 4.5,
      minPaymentCents: 35000, // $350
    },
  });

  await prisma.debt.upsert({
    where: { id: 'demo-car-loan' },
    update: {},
    create: {
      id: 'demo-car-loan',
      userId: user.id,
      name: 'Car Loan',
      balanceCents: 1200000, // $12,000
      rate: 6.5,
      minPaymentCents: 42500, // $425
    },
  });

  // Create goals
  await prisma.goal.upsert({
    where: { id: 'demo-emergency' },
    update: {},
    create: {
      id: 'demo-emergency',
      userId: user.id,
      name: 'Emergency Fund',
      targetCents: 1500000, // $15,000
      savedCents: 1000000, // $10,000
      dueDate: new Date(now.getFullYear() + 1, now.getMonth(), 1),
    },
  });

  await prisma.goal.upsert({
    where: { id: 'demo-vacation' },
    update: {},
    create: {
      id: 'demo-vacation',
      userId: user.id,
      name: 'Vacation Fund',
      targetCents: 500000, // $5,000
      savedCents: 125000, // $1,250
      dueDate: new Date(now.getFullYear(), now.getMonth() + 6, 1),
    },
  });

  // Create recurring income
  await prisma.incomeRecurring.upsert({
    where: {
      userId_name: {
        userId: user.id,
        name: 'Paycheck'
      }
    },
    update: {},
    create: {
      userId: user.id,
      name: 'Paycheck',
      amountCents: 500000, // $5,000
      schedule: 'MONTHLY',
      nextDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
    },
  });

  console.log('✅ Seed data created successfully');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });