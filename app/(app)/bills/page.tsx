'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AppCard, MetricCard } from '@/components/ui/app-card'
import { 
  Calendar, 
  Plus, 
  Download, 
  Upload,
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Target,
  Zap,
  Filter
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { getUserData, updateUserData, addBill } from '@/lib/user-data'
import { exportBillsCSV, downloadBillTemplate } from '@/lib/csv-enhanced'
import { AddBillModal } from './components/add-bill-modal'
import { PayBillModal } from './components/pay-bill-modal'

interface Bill {
  id: string
  name: string
  amount: number
  category: string
  account: string
  frequency: string
  nextDue: string
  lastPaid?: string
  active: boolean
  isOverdue: boolean
}

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [showQuickCatchUp, setShowQuickCatchUp] = useState(false)

  useEffect(() => {
    fetchBills()
  }, [])

  const fetchBills = async () => {
    try {
      // Fetch real user data from Supabase
      const userData = await getUserData()
      
      // Convert user bills to component format
      const userBills: Bill[] = userData.bills.map(bill => ({
        id: bill.id,
        name: bill.name,
        amount: bill.amount,
        category: bill.category,
        account: 'Default Account', // Would map from bill.accountId in real implementation
        frequency: bill.frequency === 'monthly' ? 'Monthly' : 
                  bill.frequency === 'quarterly' ? 'Quarterly' : 'Yearly',
        nextDue: bill.dueDate,
        active: true,
        isOverdue: bill.status === 'overdue'
      }))

      setBills(userBills)
    } catch (error) {
      console.error('Error fetching bills:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickCatchUp = () => {
    setShowQuickCatchUp(true)
  }

  const calculateStats = () => {
    const totalMonthly = bills.reduce((sum, bill) => sum + bill.amount, 0)
    const upcomingCount = bills.filter(bill => {
      const dueDate = new Date(bill.nextDue)
      const today = new Date()
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return daysUntilDue <= 7 && daysUntilDue >= 0
    }).length
    const overdueCount = bills.filter(bill => bill.isOverdue).length
    const avgBill = bills.length > 0 ? totalMonthly / bills.length : 0

    return { totalMonthly, upcomingCount, overdueCount, avgBill }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getDaysUntilDue = (dueDateStr: string) => {
    const dueDate = new Date(dueDateStr)
    const today = new Date()
    const diffTime = dueDate.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const { totalMonthly, upcomingCount, overdueCount, avgBill } = calculateStats()

  if (loading) {
    return <BillsSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Bills & Recurring Expenses
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Manage your recurring bills and never miss a payment
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="card-hover" onClick={downloadBillTemplate}>
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button variant="outline" size="sm" className="card-hover" onClick={() => exportBillsCSV(bills)}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="card-hover" 
            onClick={handleQuickCatchUp}
            data-coach-anchor="quick-catch-up-btn"
          >
            <Zap className="h-4 w-4 mr-2" />
            Quick Catch-Up
          </Button>
          <AddBillModal onSuccess={fetchBills}>
            <Button className="btn-primary rounded-xl" data-testid="add-bill-btn">
              <Plus className="h-4 w-4 mr-2" />
              Add Bill
            </Button>
          </AddBillModal>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6" data-testid="bills-kpis">
        <MetricCard
          title="Monthly Total"
          value={formatCurrency(totalMonthly)}
          subtitle="All recurring bills"
          icon={DollarSign}
          status="info"
        />
        <MetricCard
          title="Upcoming Bills"
          value={upcomingCount.toString()}
          subtitle="Due in next 7 days"
          icon={Calendar}
          status={upcomingCount > 5 ? "warn" : "success"}
        />
        <MetricCard
          title="Overdue"
          value={overdueCount.toString()}
          subtitle="Need immediate attention"
          icon={AlertCircle}
          status={overdueCount > 0 ? "danger" : "success"}
        />
        <MetricCard
          title="Avg Bill"
          value={formatCurrency(avgBill)}
          subtitle="Per bill amount"
          icon={Target}
          status="info"
        />
      </div>

      {/* Overdue Bills Alert */}
      {overdueCount > 0 && (
        <AppCard status="danger" className="border-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800 dark:text-red-200">
                {overdueCount} Overdue Bill{overdueCount > 1 ? 's' : ''}
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                You have bills that are past due. Pay them as soon as possible to avoid late fees.
              </p>
            </div>
          </div>
        </AppCard>
      )}

      {/* Bills List */}
      <AppCard
        title={`Your Bills (${bills.length})`}
        subtitle="Manage and track your recurring expenses"
        icon={CreditCard}
        elevated
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-xs">
              <Filter className="h-3 w-3 mr-1" />
              Filter
            </Button>
          </div>
        }
      >
        {bills.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">No bills added yet</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Add your recurring bills to track due dates and never miss a payment.
            </p>
            <AddBillModal onSuccess={fetchBills}>
              <Button className="btn-primary rounded-xl">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Bill
              </Button>
            </AddBillModal>
          </div>
        ) : (
          <div className="space-y-3">
            {bills.map((bill, index) => (
              <motion.div
                key={bill.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
                  bill.isOverdue 
                    ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30'
                    : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${
                      bill.isOverdue 
                        ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                        : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    }`}>
                      <CreditCard className="h-5 w-5" />
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{bill.name}</h3>
                        {bill.isOverdue && (
                          <Badge variant="destructive" className="text-xs">
                            Overdue
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{formatCurrency(bill.amount)}</span>
                        <span>•</span>
                        <span>{bill.frequency}</span>
                        <span>•</span>
                        <span>Due: {new Date(bill.nextDue).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className={getDaysUntilDue(bill.nextDue) <= 3 ? 'text-orange-600' : ''}>
                          {getDaysUntilDue(bill.nextDue) === 0 
                            ? 'Due today' 
                            : getDaysUntilDue(bill.nextDue) > 0 
                              ? `${getDaysUntilDue(bill.nextDue)} days`
                              : `${Math.abs(getDaysUntilDue(bill.nextDue))} days overdue`
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {bill.category}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {bill.account}
                    </Badge>
                    <PayBillModal bill={bill} onSuccess={fetchBills}>
                      <Button 
                        size="sm" 
                        className={bill.isOverdue ? 'bg-red-600 hover:bg-red-700' : 'btn-primary'}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Pay Now
                      </Button>
                    </PayBillModal>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AppCard>

      {/* BI Insights */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AppCard
          title="Bill Distribution"
          subtitle="By category"
          icon={Target}
          elevated
        >
          <BillCategoryInsights bills={bills} />
        </AppCard>

        <AppCard
          title="Payment Calendar"
          subtitle="Next 30 days"
          icon={Calendar}
          elevated
        >
          <UpcomingBillsCalendar bills={bills} />
        </AppCard>
      </div>

      {/* Quick Catch-Up Modal */}
      {showQuickCatchUp && (
        <QuickCatchUpModal 
          isOpen={showQuickCatchUp}
          onClose={() => setShowQuickCatchUp(false)}
          onSuccess={() => {
            setShowQuickCatchUp(false)
            toast.success('Quick catch-up completed!')
          }}
        />
      )}
    </div>
  )
}

function BillCategoryInsights({ bills }: { bills: Bill[] }) {
  const categoryTotals = bills.reduce((acc, bill) => {
    acc[bill.category] = (acc[bill.category] || 0) + bill.amount
    return acc
  }, {} as Record<string, number>)

  const totalAmount = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0)

  return (
    <div className="space-y-3">
      {Object.entries(categoryTotals).map(([category, amount], index) => {
        const percentage = (amount / totalAmount) * 100
        return (
          <div key={category} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: `hsl(${index * 60}, 70%, 50%)` }}
              />
              <span className="font-medium">{category}</span>
            </div>
            <div className="text-right">
              <div className="font-semibold">${amount.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function UpcomingBillsCalendar({ bills }: { bills: Bill[] }) {
  const upcomingBills = bills
    .filter(bill => {
      const dueDate = new Date(bill.nextDue)
      const today = new Date()
      const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
      return dueDate >= today && dueDate <= thirtyDaysFromNow
    })
    .sort((a, b) => new Date(a.nextDue).getTime() - new Date(b.nextDue).getTime())

  const getDaysUntilDue = (dueDateStr: string) => {
    const dueDate = new Date(dueDateStr)
    const today = new Date()
    const diffTime = dueDate.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="space-y-3">
      {upcomingBills.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm">No bills due in the next 30 days</p>
        </div>
      ) : (
        upcomingBills.map((bill, index) => (
          <div key={bill.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <div>
              <div className="font-medium">{bill.name}</div>
              <div className="text-sm text-muted-foreground">
                {new Date(bill.nextDue).toLocaleDateString()}
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold">${bill.amount}</div>
              <div className="text-xs text-muted-foreground">
                {getDaysUntilDue(bill.nextDue)} days
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function QuickCatchUpModal({ isOpen, onClose, onSuccess }: {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [step, setStep] = useState(1)
  const [totalAmount, setTotalAmount] = useState('')
  const [dateRange, setDateRange] = useState('7')
  const [categoryDistribution, setCategoryDistribution] = useState<Record<string, number>>({
    'Food': 30,
    'Transportation': 20,
    'Entertainment': 15,
    'Shopping': 20,
    'Utilities': 15
  })

  if (!isOpen) return null

  const handleDistribute = () => {
    // Smart distribution logic would go here
    onSuccess()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4">Quick Catch-Up</h3>
        
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Date Range</label>
              <select 
                value={dateRange} 
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="7">Last 7 days</option>
                <option value="14">Last 14 days</option>
                <option value="30">Last 30 days</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Total Spent</label>
              <input 
                type="number" 
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="Enter approximate amount"
                className="w-full p-2 border rounded-lg"
              />
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={() => setStep(2)} 
                className="btn-primary flex-1"
                disabled={!totalAmount}
              >
                Next
              </Button>
            </div>
          </div>
        )}
        
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Distribute ${totalAmount} across categories:
            </p>
            
            <div className="space-y-3">
              {Object.entries(categoryDistribution).map(([category, percentage]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm">{category}</span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={percentage}
                      onChange={(e) => setCategoryDistribution(prev => ({
                        ...prev,
                        [category]: parseInt(e.target.value)
                      }))}
                      className="w-20"
                    />
                    <span className="text-sm w-10">{percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button onClick={handleDistribute} className="btn-primary flex-1">
                Create Entries
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function BillsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-10 w-64 bg-muted rounded animate-pulse" />
          <div className="h-6 w-80 bg-muted rounded animate-pulse mt-2" />
        </div>
        <div className="flex gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-9 w-24 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-6">
            <div className="space-y-3">
              <div className="h-4 w-20 bg-muted rounded animate-pulse" />
              <div className="h-8 w-16 bg-muted rounded animate-pulse" />
              <div className="h-3 w-24 bg-muted rounded animate-pulse" />
            </div>
          </Card>
        ))}
      </div>
      
      <Card className="p-6">
        <div className="space-y-4">
          <div className="h-6 w-32 bg-muted rounded animate-pulse" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="w-12 h-12 bg-muted rounded-lg animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                <div className="h-3 w-48 bg-muted rounded animate-pulse" />
              </div>
              <div className="h-8 w-20 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}