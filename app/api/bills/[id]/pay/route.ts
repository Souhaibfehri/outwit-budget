import { NextRequest, NextResponse } from 'next/server'
import { getUserAndEnsure, updateUserMetadata } from '@/lib/ensureUser'
import { nextOccurrence } from '@/lib/recurrence'
import { z } from 'zod'

const PayBillSchema = z.object({
  accountId: z.string().optional(),
  paidAmount: z.number().positive().optional(),
  paidDate: z.string().optional(),
  note: z.string().optional()
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 401 })
    }

    const billId = params.id
    const body = await request.json()
    const validatedData = PayBillSchema.parse(body)

    const metadata = user.user_metadata || {}
    const bills = metadata.bills || []
    const transactions = metadata.transactions || []
    const accounts = metadata.accounts || []

    // Find the bill
    const billIndex = bills.findIndex((bill: any) => bill.id === billId)
    if (billIndex === -1) {
      return NextResponse.json({ success: false, error: 'Bill not found' }, { status: 404 })
    }

    const bill = bills[billIndex]
    const paidAmount = validatedData.paidAmount || bill.amount
    const paidDate = validatedData.paidDate || new Date().toISOString()
    const accountId = validatedData.accountId || bill.accountId || accounts[0]?.id

    if (!accountId) {
      return NextResponse.json({ 
        success: false, 
        error: 'No account specified and no default account found' 
      }, { status: 400 })
    }

    // Create transaction for the payment
    const paymentTransaction = {
      id: `txn_${Date.now()}`,
      userId: user.id,
      accountId,
      date: paidDate,
      merchant: bill.name,
      categoryId: bill.categoryId,
      type: 'EXPENSE',
      amountCents: Math.round(-paidAmount * 100), // Negative for expense
      note: validatedData.note || `Bill payment: ${bill.name}`,
      source: 'bill_payment',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Update bill with next due date
    const updatedBill = {
      ...bill,
      lastPaid: paidDate,
      updatedAt: new Date().toISOString()
    }

    // Calculate next due date if recurrence is set
    if (bill.recurrence && bill.recurrence.active) {
      const nextDue = nextOccurrence(bill.recurrence, new Date(paidDate))
      if (nextDue) {
        updatedBill.nextDue = nextDue.toISOString()
      }
    }

    // Update bills and transactions
    const updatedBills = [...bills]
    updatedBills[billIndex] = updatedBill

    const updatedTransactions = [...transactions, paymentTransaction]

    // Update account balance if it exists
    const updatedAccounts = accounts.map((account: any) => {
      if (account.id === accountId) {
        return {
          ...account,
          balanceCents: (account.balanceCents || 0) - Math.round(paidAmount * 100),
          updatedAt: new Date().toISOString()
        }
      }
      return account
    })

    const result = await updateUserMetadata({
      ...metadata,
      bills: updatedBills,
      transactions: updatedTransactions,
      accounts: updatedAccounts.length > 0 ? updatedAccounts : accounts
    })

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      bill: updatedBill,
      transaction: paymentTransaction,
      message: 'Bill marked as paid successfully'
    })

  } catch (error) {
    console.error('Error paying bill:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid payment data',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to pay bill'
    }, { status: 500 })
  }
}
