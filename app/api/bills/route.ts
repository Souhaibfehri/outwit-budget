import { NextRequest, NextResponse } from 'next/server'
import { getUserAndEnsure, updateUserMetadata } from '@/lib/ensureUser'
import { nextOccurrence } from '@/lib/recurrence'
import { z } from 'zod'

const CreateBillSchema = z.object({
  name: z.string().min(1, 'Bill name is required'),
  amount: z.number().positive('Amount must be positive'),
  categoryId: z.string().optional(),
  accountId: z.string().optional(),
  recurrence: z.object({
    frequency: z.enum(['daily', 'weekly', 'bi-weekly', 'monthly', 'quarterly', 'semi-annual', 'annual']),
    interval: z.number().default(1),
    byMonthDay: z.number().optional(),
    startDate: z.string(),
    timezone: z.string().default('UTC')
  }).optional(),
  nextDue: z.string().optional(),
  active: z.boolean().default(true)
})

export async function GET(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 401 })
    }

    const metadata = user.user_metadata || {}
    const bills = metadata.bills || []

    // Enrich bills with category and account names
    const categories = metadata.categories || []
    const accounts = metadata.accounts || []
    
    const enrichedBills = bills.map((bill: any) => {
      const category = categories.find((c: any) => c.id === bill.categoryId)
      const account = accounts.find((a: any) => a.id === bill.accountId)
      
      return {
        ...bill,
        categoryName: category?.name || 'Uncategorized',
        accountName: account?.name || 'No Account'
      }
    })

    return NextResponse.json({
      success: true,
      bills: enrichedBills
    })

  } catch (error) {
    console.error('Error fetching bills:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch bills'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = CreateBillSchema.parse(body)

    const metadata = user.user_metadata || {}
    const existingBills = metadata.bills || []

    // Create new bill
    const newBill = {
      id: `bill_${Date.now()}`,
      userId: user.id,
      name: validatedData.name,
      amount: validatedData.amount,
      categoryId: validatedData.categoryId,
      accountId: validatedData.accountId,
      nextDue: validatedData.nextDue || new Date().toISOString(),
      active: validatedData.active,
      recurrence: validatedData.recurrence ? {
        ...validatedData.recurrence,
        startDate: new Date(validatedData.recurrence.startDate),
        active: true
      } : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // If recurrence is provided, calculate next due date
    if (newBill.recurrence) {
      const nextDue = nextOccurrence(newBill.recurrence, new Date())
      if (nextDue) {
        newBill.nextDue = nextDue.toISOString()
      }
    }

    const updatedBills = [...existingBills, newBill]

    const result = await updateUserMetadata({
      ...metadata,
      bills: updatedBills
    })

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      bill: newBill,
      message: 'Bill created successfully'
    })

  } catch (error) {
    console.error('Error creating bill:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid bill data',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to create bill'
    }, { status: 500 })
  }
}
