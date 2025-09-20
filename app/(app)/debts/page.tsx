'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AppCard, MetricCard } from '@/components/ui/app-card'
import { InfoPill } from '@/components/ui/info-pill'
import { APRTooltip, SnowballTooltip, AvalancheTooltip } from '@/components/foxy/jargon-tooltip'
import { 
  Plus,
  Calculator,
  TrendingDown,
  Calendar,
  DollarSign,
  Target,
  Edit,
  Trash2,
  PlayCircle,
  BarChart3,
  BookOpen,
  Lightbulb,
  Zap,
  Trophy,
  AlertCircle
} from 'lucide-react'
import { DebtPayoffSimulator } from '@/components/debts/debt-payoff-simulator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { getUserData, updateUserData } from '@/lib/user-data'

interface Debt {
  id: string
  name: string
  balance: number
  interest: number
  minPayment: number
  type: 'credit_card' | 'personal_loan' | 'auto_loan' | 'student_loan' | 'other'
}

interface PayoffPlan {
  method: 'avalanche' | 'snowball'
  extraPayment: number
  totalInterest: number
  payoffDate: string
  monthsToPayoff: number
  order: Array<{ debtId: string; name: string; order: number }>
}

const SAMPLE_SCENARIOS = {
  creditCardStack: [
    { id: '1', name: 'Chase Sapphire', balance: 3500, interest: 24.99, minPayment: 105, type: 'credit_card' as const },
    { id: '2', name: 'Capital One', balance: 1200, interest: 22.49, minPayment: 35, type: 'credit_card' as const },
    { id: '3', name: 'Store Card', balance: 450, interest: 27.99, minPayment: 25, type: 'credit_card' as const }
  ],
  autoAndPersonal: [
    { id: '1', name: 'Auto Loan', balance: 18500, interest: 6.25, minPayment: 385, type: 'auto_loan' as const },
    { id: '2', name: 'Personal Loan', balance: 8200, interest: 14.99, minPayment: 245, type: 'personal_loan' as const }
  ],
  studentLoans: [
    { id: '1', name: 'Federal Loan 1', balance: 12500, interest: 4.53, minPayment: 145, type: 'student_loan' as const },
    { id: '2', name: 'Federal Loan 2', balance: 8900, interest: 5.28, minPayment: 105, type: 'student_loan' as const },
    { id: '3', name: 'Private Loan', balance: 15600, interest: 8.75, minPayment: 185, type: 'student_loan' as const }
  ]
}

export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedScenario, setSelectedScenario] = useState<keyof typeof SAMPLE_SCENARIOS | null>(null)
  const [simulatorDebts, setSimulatorDebts] = useState<Debt[]>([])
  const [extraPayment, setExtraPayment] = useState(200)
  const [payoffPlan, setPayoffPlan] = useState<PayoffPlan | null>(null)
  const [activeTab, setActiveTab] = useState('debts')

  useEffect(() => {
    fetchDebts()
  }, [])

  const fetchDebts = async () => {
    try {
      // Fetch real user data from Supabase
      const userData = await getUserData()
      
      // Convert user debts to component format
      const userDebts: Debt[] = userData.debts.map(debt => ({
        id: debt.id,
        name: debt.name,
        balance: debt.balance,
        interest: debt.interest,
        minPayment: debt.minPayment,
        type: debt.type
      }))
      
      setDebts(userDebts)
      setSimulatorDebts(userDebts) // Use real debts as default for simulator
    } catch (error) {
      console.error('Error fetching debts:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const loadScenario = (scenario: keyof typeof SAMPLE_SCENARIOS) => {
    setSelectedScenario(scenario)
    setSimulatorDebts(SAMPLE_SCENARIOS[scenario])
    toast.success(`Loaded ${scenario.replace(/([A-Z])/g, ' $1').toLowerCase()} scenario`)
  }

  const calculatePayoff = () => {
    if (simulatorDebts.length === 0) {
      toast.error('Please select a debt scenario first!')
      return
    }

    // Advanced debt avalanche calculation with proper amortization
    const sortedDebts = [...simulatorDebts].sort((a, b) => b.interest - a.interest)
    const totalMinPayments = simulatorDebts.reduce((sum, debt) => sum + debt.minPayment, 0)
    const totalAvailable = totalMinPayments + extraPayment

    if (totalAvailable <= 0) {
      toast.error('Total payment must be greater than $0')
      return
    }

    // Calculate actual payoff with compound interest
    let remainingDebts = sortedDebts.map(debt => ({ ...debt }))
    let totalInterestPaid = 0
    let months = 0
    const maxMonths = 600 // 50 years max to prevent infinite loops

    while (remainingDebts.some(d => d.balance > 0.01) && months < maxMonths) {
      months++
      let availablePayment = totalAvailable
      
      // Pay minimum on all debts first
      remainingDebts.forEach(debt => {
        if (debt.balance <= 0) return
        
        const monthlyInterestRate = debt.interest / 100 / 12
        const interestPayment = debt.balance * monthlyInterestRate
        const minPayment = Math.min(debt.minPayment, debt.balance + interestPayment)
        const principalPayment = Math.max(0, minPayment - interestPayment)
        
        totalInterestPaid += interestPayment
        debt.balance = Math.max(0, debt.balance - principalPayment)
        availablePayment -= minPayment
      })

      // Apply extra payment to highest interest debt
      if (availablePayment > 0) {
        const targetDebt = remainingDebts.find(d => d.balance > 0)
        if (targetDebt) {
          const extraApplied = Math.min(availablePayment, targetDebt.balance)
          targetDebt.balance -= extraApplied
        }
      }
    }

    const totalBalance = simulatorDebts.reduce((sum, debt) => sum + debt.balance, 0)
    const payoffDate = new Date()
    payoffDate.setMonth(payoffDate.getMonth() + months)

    const plan: PayoffPlan = {
      method: 'avalanche',
      extraPayment,
      totalInterest: Math.round(totalInterestPaid),
      payoffDate: payoffDate.toLocaleDateString(),
      monthsToPayoff: months,
      order: sortedDebts.map((debt, index) => ({
        debtId: debt.id,
        name: debt.name,
        order: index + 1
      }))
    }

    setPayoffPlan(plan)
    
    // Emit event for tutorial tracking
    window.dispatchEvent(new CustomEvent('debt-simulator-run'))
    
    const yearsSaved = (months / 12).toFixed(1)
    toast.success(`Debt payoff calculated! Pay off in ${months} months (${yearsSaved} years). Total interest: $${Math.round(totalInterestPaid).toLocaleString()}`)
  }

  const totalDebt = debts.reduce((sum, debt) => sum + debt.balance, 0)
  const totalMinPayments = debts.reduce((sum, debt) => sum + debt.minPayment, 0)
  const avgInterest = totalDebt > 0 
    ? debts.reduce((sum, debt) => sum + (debt.interest * debt.balance), 0) / totalDebt
    : 0

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Debt Payoff
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Smart strategies to become debt-free faster
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="card-hover">
            Export Debts
          </Button>
          <Button className="btn-primary rounded-xl">
            <Plus className="h-4 w-4 mr-2" />
            Add Debt
          </Button>
        </div>
      </div>

      {/* Debt Overview */}
      <div className="grid gap-6 md:grid-cols-3" data-testid="debt-kpis">
        <MetricCard
          title="Total Debt"
          value={formatCurrency(totalDebt)}
          subtitle={`${debts.length} active debts`}
          icon={DollarSign}
          status={totalDebt > 50000 ? "danger" : totalDebt > 20000 ? "warn" : "info"}
        />
        <MetricCard
          title="Min Payments"
          value={formatCurrency(totalMinPayments)}
          subtitle="Required monthly"
          icon={Calendar}
          status="info"
        />
        <MetricCard
          title="Avg Interest"
          value={`${avgInterest.toFixed(2)}%`}
          subtitle="Weighted average APR"
          icon={TrendingDown}
          status={avgInterest > 15 ? "danger" : avgInterest > 8 ? "warn" : "success"}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="debts">Your Debts</TabsTrigger>
          <TabsTrigger value="simulator">Debt Simulator</TabsTrigger>
          <TabsTrigger value="learn">Learn</TabsTrigger>
        </TabsList>

        {/* Your Debts Tab */}
        <TabsContent value="debts" className="space-y-6">
          <AppCard
            title="Your Debts"
            subtitle={`${debts.length} active debts`}
            icon={Target}
            elevated
          >
            {loading ? (
              <DebtsListSkeleton />
            ) : debts.length === 0 ? (
              <div className="text-center py-12">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No debts tracked</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Add your debts to create a payoff strategy.
                </p>
                <Button className="btn-primary rounded-xl">
                  Add Your First Debt
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {debts.map((debt, index) => {
                  const progressPercent = Math.min(100, (debt.minPayment / debt.balance) * 100 * 12)
                  
                  return (
                    <motion.div
                      key={debt.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="p-6 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900">
                            <TrendingDown className="h-5 w-5 text-red-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{debt.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {debt.interest}% APR
                              </Badge>
                              <InfoPill concept="apr" />
                              <Badge variant="outline" className="text-xs">
                                {debt.type.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                            Balance: {formatCurrency(debt.balance)}
                          </span>
                          <span className="font-medium flex items-center gap-1">
                            Min Payment: {formatCurrency(debt.minPayment)}
                            <InfoPill concept="minimumPayment" />
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span>Payoff Progress</span>
                            <span>{progressPercent.toFixed(1)}% annually</span>
                          </div>
                          <Progress value={progressPercent} className="h-2" />
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </AppCard>
        </TabsContent>

        {/* Debt Simulator Tab */}
        <TabsContent value="simulator" className="space-y-6">
          <DebtPayoffSimulator initialDebts={debts} />
        </TabsContent>

        <TabsContent value="legacy-simulator" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Simulator Controls */}
            <AppCard
              title="Debt Simulator"
              subtitle="Try different payoff strategies"
              icon={Calculator}
              elevated
              className="data-coach-anchor-debt-simulator"
            >
              <div className="space-y-4">
                {/* Sample Scenarios */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Try a Sample Scenario</Label>
                  <div className="grid gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadScenario('creditCardStack')}
                      className={selectedScenario === 'creditCardStack' ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : ''}
                    >
                      Credit Card Stack ($5,150 total)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadScenario('autoAndPersonal')}
                      className={selectedScenario === 'autoAndPersonal' ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : ''}
                    >
                      Auto + Personal Loan ($26,700 total)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadScenario('studentLoans')}
                      className={selectedScenario === 'studentLoans' ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : ''}
                    >
                      Student Loans ($37,000 total)
                    </Button>
                  </div>
                </div>

                {/* Extra Payment */}
                <div>
                  <Label htmlFor="extra-payment" className="text-sm font-medium mb-2 block">
                    Extra Monthly Payment
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="extra-payment"
                      type="number"
                      value={extraPayment}
                      onChange={(e) => setExtraPayment(parseInt(e.target.value) || 0)}
                      className="pl-10"
                      placeholder="200"
                    />
                  </div>
                </div>

                <Button onClick={calculatePayoff} className="w-full btn-primary">
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculate Payoff Plan
                </Button>
              </div>
            </AppCard>

            {/* Results */}
            <AppCard
              title="Payoff Results"
              subtitle={payoffPlan ? "Debt Avalanche Strategy" : "Run simulation to see results"}
              icon={BarChart3}
              elevated
            >
              {payoffPlan ? (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                      <div className="text-sm text-green-700 dark:text-green-300 mb-1">Debt-Free Date</div>
                      <div className="font-semibold text-green-800 dark:text-green-200">{payoffPlan.payoffDate}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                      <div className="text-sm text-blue-700 dark:text-blue-300 mb-1">Total Interest</div>
                      <div className="font-semibold text-blue-800 dark:text-blue-200">{formatCurrency(payoffPlan.totalInterest)}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-2 flex items-center gap-1">
                      Payoff Order (Avalanche Method)
                      <InfoPill concept="avalanche" />
                    </div>
                    <div className="space-y-2">
                      {payoffPlan.order.map((item) => (
                        <div key={item.debtId} className="flex items-center gap-3 p-2 rounded border">
                          <Badge variant="outline" className="w-6 h-6 rounded-full flex items-center justify-center text-xs">
                            {item.order}
                          </Badge>
                          <span className="text-sm">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button variant="outline" className="w-full">
                    Apply This Plan to My Debts
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Select a scenario and run the simulation to see your payoff plan.
                  </p>
                </div>
              )}
            </AppCard>
          </div>
        </TabsContent>

        {/* Learn Tab */}
        <TabsContent value="learn" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Educational Content */}
            <AppCard
              title="Debt Payoff Strategies"
              subtitle="Learn the best methods to eliminate debt"
              icon={BookOpen}
              elevated
              data-testid="debt-education"
            >
              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                  <div className="flex items-start gap-3">
                    <Trophy className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-green-800 dark:text-green-200 mb-1 flex items-center gap-2">
                        <AvalancheTooltip>Debt Avalanche</AvalancheTooltip> (Recommended)
                      </h4>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Pay minimums on all debts, then attack the highest interest rate first. 
                        Saves the most money mathematically.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-1 flex items-center gap-2">
                        Debt Snowball (Motivational)
                        <InfoPill concept="snowball" />
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Pay minimums on all debts, then attack the smallest balance first. 
                        Provides quick psychological wins.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-1 flex items-center gap-2">
                        Fixed vs Revolving Debt
                        <InfoPill concept="fixedVsRevolving" />
                      </h4>
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        Understanding your debt types helps you prioritize payments and 
                        avoid common traps like minimum-only credit card payments.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </AppCard>

            {/* Interactive Example */}
            <AppCard
              title="Live Example"
              subtitle="See how extra payments make a difference"
              icon={Lightbulb}
              elevated
            >
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <h4 className="font-semibold mb-2">Example: $5,000 Credit Card at 18% APR</h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Minimum only ($150/month):</span>
                      <span className="font-medium text-red-600">3.2 years, $1,737 interest</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>+ $50 extra ($200/month):</span>
                      <span className="font-medium text-orange-600">2.1 years, $1,089 interest</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>+ $100 extra ($250/month):</span>
                      <span className="font-medium text-green-600">1.7 years, $846 interest</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 p-3 bg-green-100 dark:bg-green-900 rounded border border-green-200 dark:border-green-700">
                    <p className="text-xs text-green-700 dark:text-green-300">
                      💡 Just $100 extra per month saves $891 in interest and gets you debt-free 1.5 years sooner!
                    </p>
                  </div>
                </div>

                <Button variant="outline" className="w-full">
                  Try This with Your Numbers
                </Button>
              </div>
            </AppCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function DebtsListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="p-6 border rounded-xl">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-muted rounded-xl animate-pulse" />
              <div>
                <div className="h-5 w-32 bg-muted rounded animate-pulse mb-2" />
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-8 bg-muted rounded animate-pulse" />
              <div className="h-8 w-8 bg-muted rounded animate-pulse" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-4 w-full bg-muted rounded animate-pulse" />
            <div className="h-3 w-full bg-muted rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}