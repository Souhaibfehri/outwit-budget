'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AppCard, MetricCard } from '@/components/ui/app-card'
import { 
  TrendingUp, 
  Plus, 
  Download, 
  Upload,
  PiggyBank,
  Target,
  DollarSign,
  Calendar,
  BarChart3,
  ArrowUpRight,
  Calculator,
  Sparkles
} from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { getUserData, updateUserData } from '@/lib/user-data'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { exportInvestmentsCSV } from '@/lib/csv-enhanced'
import { GrowthSimulator } from '@/components/investments/growth-simulator'

interface Investment {
  id: string
  name: string
  amount: number
  frequency: string
  expectedAPR: number
  nextDate: string
  autoInvest: boolean
  active: boolean
  currentValue?: number
}

interface SimulationResult {
  years: number
  finalAmount: number
  totalContributions: number
  totalGrowth: number
  monthlyBreakdown: Array<{
    month: number
    contribution: number
    growth: number
    balance: number
  }>
}

export default function InvestmentsPage() {
  const [investments, setInvestments] = useState<Investment[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showSimulator, setShowSimulator] = useState(false)
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null)

  useEffect(() => {
    fetchInvestments()
  }, [])

  const fetchInvestments = async () => {
    try {
      // Fetch real user data from Supabase
      const userData = await getUserData()
      
      // Convert user investments to component format
      const userInvestments: Investment[] = userData.investments.map(inv => ({
        id: inv.id,
        name: inv.name,
        amount: inv.monthlyContribution,
        frequency: 'Monthly', // Default frequency
        expectedAPR: inv.expectedAPR,
        nextDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Next month
        autoInvest: inv.autoInvest,
        active: true,
        currentValue: inv.currentValue
      }))
      
      setInvestments(userInvestments)
    } catch (error) {
      console.error('Error fetching investments:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = () => {
    const totalMonthlyContribution = investments.reduce((sum, inv) => {
      if (inv.frequency === 'Monthly') return sum + inv.amount
      if (inv.frequency === 'Bi-weekly') return sum + (inv.amount * 2)
      if (inv.frequency === 'Weekly') return sum + (inv.amount * 4)
      return sum
    }, 0)
    
    const totalCurrentValue = investments.reduce((sum, inv) => sum + (inv.currentValue || 0), 0)
    const avgAPR = investments.length > 0 
      ? investments.reduce((sum, inv) => sum + inv.expectedAPR, 0) / investments.length 
      : 0
    const autoInvestCount = investments.filter(inv => inv.autoInvest).length

    return { totalMonthlyContribution, totalCurrentValue, avgAPR, autoInvestCount }
  }

  const runGrowthSimulation = (years: number = 10, monthlyContribution: number = 500, apr: number = 0.08) => {
    const monthlyRate = apr / 12
    const months = years * 12
    let balance = 0
    let totalContributions = 0
    const breakdown = []

    for (let month = 1; month <= months; month++) {
      const growth = balance * monthlyRate
      balance += growth + monthlyContribution
      totalContributions += monthlyContribution
      
      if (month % 12 === 0) { // Save yearly snapshots
        breakdown.push({
          month,
          contribution: monthlyContribution,
          growth,
          balance
        })
      }
    }

    const result: SimulationResult = {
      years,
      finalAmount: balance,
      totalContributions,
      totalGrowth: balance - totalContributions,
      monthlyBreakdown: breakdown
    }

    setSimulationResult(result)
    setShowSimulator(true)
  }

  const handleContribute = async (investmentId: string) => {
    try {
      const investment = investments.find(inv => inv.id === investmentId)
      if (!investment) {
        toast.error('Investment not found')
        return
      }

      // Update investment value (simulate growth + contribution)
      const newValue = investment.currentValue + investment.amount
      
      // Update in user data
      const userData = await getUserData()
      const updatedInvestments = userData.investments.map(inv => 
        inv.id === investmentId 
          ? { ...inv, currentValue: newValue }
          : inv
      )
      
      const success = await updateUserData({ investments: updatedInvestments })
      
      if (success) {
        // Update local state
        setInvestments(prev => prev.map(inv => 
          inv.id === investmentId 
            ? { ...inv, currentValue: newValue }
            : inv
        ))
        
        toast.success(`$${investment.amount} contribution recorded! New value: $${newValue.toLocaleString()}`)
        
        // Emit event for tutorial tracking
        window.dispatchEvent(new CustomEvent('investment-contribute', { 
          detail: { investmentId, amount: investment.amount }
        }))
      } else {
        toast.error('Failed to record contribution')
      }
    } catch (error) {
      console.error('Error recording contribution:', error)
      toast.error('Failed to record contribution')
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

  const formatPercentage = (rate: number) => {
    return `${(rate * 100).toFixed(1)}%`
  }

  const { totalMonthlyContribution, totalCurrentValue, avgAPR, autoInvestCount } = calculateStats()

  if (loading) {
    return <InvestmentsSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Investments
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Build wealth through strategic investing
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="card-hover" onClick={() => exportInvestmentsCSV(investments)}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="card-hover"
            onClick={() => runGrowthSimulation()}
          >
            <Calculator className="h-4 w-4 mr-2" />
            Growth Simulator
          </Button>
          <Button 
            className="btn-primary rounded-xl"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Investment
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Portfolio Value"
          value={formatCurrency(totalCurrentValue)}
          subtitle="Current total value"
          icon={PiggyBank}
          status="success"
          trend={{
            value: 12.5,
            isPositive: true
          }}
        />
        <MetricCard
          title="Monthly Contributions"
          value={formatCurrency(totalMonthlyContribution)}
          subtitle="Total monthly investing"
          icon={DollarSign}
          status="info"
        />
        <MetricCard
          title="Avg Expected Return"
          value={formatPercentage(avgAPR)}
          subtitle="Weighted average APR"
          icon={TrendingUp}
          status={avgAPR >= 0.07 ? "success" : "warn"}
        />
        <MetricCard
          title="Auto-Invest Plans"
          value={autoInvestCount.toString()}
          subtitle="Automated contributions"
          icon={Target}
          status="info"
        />
      </div>

      {/* Investments List */}
      <AppCard
        title={`Your Investment Plans (${investments.length})`}
        subtitle="Manage and track your investment contributions"
        icon={TrendingUp}
        elevated
      >
        {investments.length === 0 ? (
          <div className="text-center py-12">
            <PiggyBank className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">No investment plans yet</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Start building wealth by setting up your first investment plan.
            </p>
            <Button 
              className="btn-primary rounded-xl"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Investment
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {investments.map((investment, index) => (
              <motion.div
                key={investment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{investment.name}</h3>
                        {investment.autoInvest && (
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            Auto-Invest
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{formatCurrency(investment.amount)} / {investment.frequency}</span>
                        <span>•</span>
                        <span>Expected: {formatPercentage(investment.expectedAPR)}</span>
                        <span>•</span>
                        <span>Value: {formatCurrency(investment.currentValue || 0)}</span>
                        <span>•</span>
                        <span>Next: {new Date(investment.nextDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      className="btn-primary"
                      onClick={() => handleContribute(investment.id)}
                    >
                      <DollarSign className="h-4 w-4 mr-1" />
                      Contribute
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AppCard>

      {/* Enhanced Growth Simulator */}
      <GrowthSimulator />

      {/* Legacy Growth Simulator Modal */}
      {showSimulator && simulationResult && (
        <Dialog open={showSimulator} onOpenChange={setShowSimulator}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Investment Growth Simulation
              </DialogTitle>
              <DialogDescription>
                {simulationResult.years}-year projection with {formatCurrency(totalMonthlyContribution)} monthly contributions
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {formatCurrency(simulationResult.finalAmount)}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">Final Portfolio Value</div>
                </div>
                
                <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {formatCurrency(simulationResult.totalGrowth)}
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">Investment Growth</div>
                </div>
                
                <div className="text-center p-4 rounded-lg bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800">
                  <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                    {formatCurrency(simulationResult.totalContributions)}
                  </div>
                  <div className="text-sm text-orange-600 dark:text-orange-400">Total Contributions</div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Growth Projection</h4>
                <div className="space-y-2">
                  {simulationResult.monthlyBreakdown.slice(0, 5).map((year, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="font-medium">Year {Math.floor(year.month / 12)}</span>
                      <span className="font-semibold">{formatCurrency(year.balance)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSimulator(false)}>
                Close
              </Button>
              <Button className="btn-primary">
                Start Investing
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Investment Modal */}
      {showAddModal && (
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Investment Plan</DialogTitle>
              <DialogDescription>
                Set up a new investment contribution plan to build wealth over time.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="investment-name">Investment Name</Label>
                <Input id="investment-name" placeholder="e.g., S&P 500 Index Fund, 401(k)" />
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="amount">Contribution Amount</Label>
                  <Input id="amount" type="number" placeholder="500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="apr">Expected Annual Return (%)</Label>
                  <Input id="apr" type="number" step="0.1" placeholder="8.0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="next-date">Next Contribution Date</Label>
                  <Input id="next-date" type="date" />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button 
                className="btn-primary"
                onClick={() => {
                  toast.success('Investment plan added!')
                  setShowAddModal(false)
                }}
              >
                Add Investment Plan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function InvestmentsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-10 w-48 bg-muted rounded animate-pulse" />
          <div className="h-6 w-64 bg-muted rounded animate-pulse mt-2" />
        </div>
        <div className="flex gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
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
    </div>
  )
}
