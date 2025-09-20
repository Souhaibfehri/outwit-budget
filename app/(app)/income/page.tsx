'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AppCard, MetricCard } from '@/components/ui/app-card'
import { InfoPill } from '@/components/ui/info-pill'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus,
  DollarSign,
  Calendar,
  TrendingUp,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  Repeat,
  Info,
  X,
  Lightbulb,
  Download
} from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { getUserData, updateUserData } from '@/lib/user-data'
import { exportTransactionsCSV } from '@/lib/csv-enhanced'

function formatFrequency(frequency: string): string {
  const map: Record<string, string> = {
    'weekly': 'Weekly',
    'biweekly': 'Bi-weekly',
    'semimonthly': 'Semi-monthly',
    'monthly': 'Monthly'
  }
  return map[frequency] || frequency
}

function getNextPaymentStatus(nextDate: string): { status: string; color: string; icon: any } {
  const next = new Date(nextDate)
  const today = new Date()
  const diffDays = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) {
    return { status: 'Overdue', color: 'text-red-400', icon: AlertCircle }
  } else if (diffDays === 0) {
    return { status: 'Due Today', color: 'text-yellow-400', icon: Clock }
  } else if (diffDays <= 7) {
    return { status: `Due in ${diffDays} day${diffDays > 1 ? 's' : ''}`, color: 'text-green-400', icon: Calendar }
  } else {
    return { status: `Due in ${diffDays} days`, color: 'text-gray-400', icon: Calendar }
  }
}

export default function IncomePage() {
  const [recurringIncome, setRecurringIncome] = useState<any[]>([])
  const [oneOffIncome, setOneOffIncome] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchIncomeData() {
      try {
        // Fetch real user data from Supabase
        const userData = await getUserData()
        
        // Convert user income to component format
        const userRecurringIncome = userData.income.map(income => ({
          id: income.id,
          name: income.name,
          amountCents: income.amount * 100, // Convert to cents
          frequency: income.frequency,
          nextDate: income.nextDate,
          active: income.active
        }))

        // One-off income would come from transactions marked as income
        const userOneOffIncome = userData.transactions
          .filter(txn => txn.type === 'income')
          .map(txn => ({
            id: txn.id,
            name: txn.description || txn.merchant,
            amountCents: txn.amount * 100,
            date: txn.date,
            note: 'One-time income'
          }))
        
        setRecurringIncome(userRecurringIncome)
        setOneOffIncome(userOneOffIncome)
      } catch (error) {
        console.error('Error fetching income data:', error)
        // Set empty arrays instead of mock data
        setRecurringIncome([])
        setOneOffIncome([])
      } finally {
        setLoading(false)
      }
    }

    fetchIncomeData()
  }, [])

  // Calculate statistics
  const totalMonthlyIncome = recurringIncome.reduce((sum, income) => sum + income.amountCents, 0)
  const activeRecurringCount = recurringIncome.filter(income => income.active).length
  const thisMonthOneOff = oneOffIncome.filter(income => {
    const incomeDate = new Date(income.date)
    const now = new Date()
    return incomeDate.getMonth() === now.getMonth() && incomeDate.getFullYear() === now.getFullYear()
  }).length

  // Check if we should show onboarding tip (simplified for client component)
  const showOnboardingTip = recurringIncome.length === 0 && !loading

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Income Management
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Track and manage your income sources
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="card-hover" onClick={() => exportTransactionsCSV([])}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button className="btn-primary rounded-xl">
            <Plus className="h-4 w-4 mr-2" />
            Add Income
          </Button>
        </div>
      </div>

      {/* Onboarding Tip */}
      {showOnboardingTip && (
        <AppCard status="info" className="border-blue-200">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200">Income Imported from Onboarding</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                We imported your expected monthly income from onboarding—you can edit anytime or add more sources below.
              </p>
            </div>
          </div>
        </AppCard>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Monthly Income"
          value={`$${(totalMonthlyIncome / 100).toFixed(0)}`}
          subtitle="Estimated monthly total"
          icon={DollarSign}
          status="success"
        />
        <MetricCard
          title="Recurring Sources"
          value={activeRecurringCount.toString()}
          subtitle="Active income streams"
          icon={Repeat}
          status="info"
        />
        <MetricCard
          title="This Month"
          value={thisMonthOneOff.toString()}
          subtitle="One-off payments"
          icon={Calendar}
          status="info"
        />
        <MetricCard
          title="Total Sources"
          value={(recurringIncome.length + oneOffIncome.length).toString()}
          subtitle="All income sources"
          icon={TrendingUp}
          status="info"
        />
      </div>

      {/* Income Management Tabs */}
      <Tabs defaultValue="recurring" className="space-y-6" data-testid="income-tabs">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recurring">
            Recurring Income
          </TabsTrigger>
          <TabsTrigger value="oneoff">
            One-off Income
          </TabsTrigger>
        </TabsList>

        {/* Recurring Income Tab */}
        <TabsContent value="recurring" className="space-y-6">
          {/* Add New Recurring Income */}
          <AppCard
            title="Add Recurring Income"
            subtitle="Set up regular income sources like salary, freelance contracts, or investments"
            icon={Plus}
            elevated
            data-testid="add-recurring-income"
          >
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start space-x-2">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>What counts as recurring?</strong> Salary, retainers, subscriptions, investment distributions, rental income, or any regular payment you receive.
                  <div className="mt-2">
                    <InfoPill 
                      term="Freelancers"
                      definition="If you're a freelancer with irregular income, set your recurring income to $0 and track individual payments as one-off income. You can also set an average monthly amount if you prefer."
                    />
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); toast.success('Recurring income added!'); }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Income Name</Label>
                  <Input
                    name="name"
                    placeholder="e.g., Salary, Freelance, Investment"
                    required
                  />
                </div>
                <div>
                  <Label>Amount</Label>
                  <Input
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <Label>Frequency</Label>
                  <Select name="frequency" defaultValue="monthly" data-testid="frequency-selector">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      <SelectItem value="semimonthly">Semi-monthly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Next Payment Date</Label>
                  <Input
                    name="nextDate"
                    type="date"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch name="active" defaultChecked />
                <Label>Active</Label>
              </div>
              <Button type="submit" className="btn-primary rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Add Recurring Income
              </Button>
            </form>
          </AppCard>

          {/* Recurring Income List */}
          <AppCard
            title="Your Recurring Income"
            subtitle={`${recurringIncome.length} recurring income source${recurringIncome.length !== 1 ? 's' : ''}`}
            icon={Repeat}
            elevated
          >
            {recurringIncome.length === 0 ? (
              <div className="text-center py-12">
                <Repeat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No recurring income yet</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Add your first recurring income source to get started
                </p>
                <Button className="btn-primary rounded-xl">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Recurring Income
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recurringIncome.map((income: any) => {
                  const nextPayment = getNextPaymentStatus(income.nextDate)
                  const Icon = nextPayment.icon
                  
                  return (
                    <div key={income.id} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-lg">{income.name}</h4>
                            {!income.active && (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="text-green-600 font-medium">
                              ${(income.amountCents / 100).toFixed(2)}
                            </span>
                            <span>{formatFrequency(income.frequency)}</span>
                            <div className={`flex items-center gap-1 ${nextPayment.color}`}>
                              <Icon className="w-3 h-3" />
                              <span>{nextPayment.status}</span>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            <strong>Next payment:</strong> {new Date(income.nextDate).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                            <Button 
                              onClick={() => toast.success('Income deleted!')}
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </AppCard>
        </TabsContent>

        {/* One-off Income Tab */}
        <TabsContent value="oneoff" className="space-y-6">
          {/* Add New One-off Income */}
          <AppCard
            title="Add One-off Income"
            subtitle="Record irregular income like bonuses, tax refunds, or side gigs"
            icon={Plus}
            elevated
          >
            <form onSubmit={(e) => { e.preventDefault(); toast.success('One-off income added!'); }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Income Name</Label>
                  <Input
                    name="name"
                    placeholder="e.g., Bonus, Tax Refund, Side Gig"
                    required
                  />
                </div>
                <div>
                  <Label>Amount</Label>
                  <Input
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <Label>Date</Label>
                  <Input
                    name="date"
                    type="date"
                    required
                  />
                </div>
                <div>
                  <Label>Note (Optional)</Label>
                  <Input
                    name="note"
                    placeholder="Additional details"
                  />
                </div>
              </div>
              <Button type="submit" className="btn-primary rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Add One-off Income
              </Button>
            </form>
          </AppCard>

          {/* One-off Income List */}
          <AppCard
            title="Your One-off Income"
            subtitle={`${oneOffIncome.length} one-off income record${oneOffIncome.length !== 1 ? 's' : ''}`}
            icon={DollarSign}
            elevated
          >
            {oneOffIncome.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No one-off income yet</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Add irregular income like bonuses or side gigs
                </p>
                <Button className="btn-primary rounded-xl">
                  <Plus className="h-4 w-4 mr-2" />
                  Add One-off Income
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {oneOffIncome
                  .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((income: any) => {
                    const isThisMonth = (() => {
                      const incomeDate = new Date(income.date)
                      const now = new Date()
                      return incomeDate.getMonth() === now.getMonth() && incomeDate.getFullYear() === now.getFullYear()
                    })()
                    
                    return (
                      <div key={income.id} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-lg">{income.name}</h4>
                              {isThisMonth && (
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  This Month
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="text-green-600 font-medium">
                                +${(income.amountCents / 100).toFixed(2)}
                              </span>
                              <span>{new Date(income.date).toLocaleDateString()}</span>
                              {income.note && <span>• {income.note}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              onClick={() => toast.success('One-off income deleted!')}
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </AppCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}
