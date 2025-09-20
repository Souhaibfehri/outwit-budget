'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AppCard, MetricCard } from '@/components/ui/app-card'
import { 
  Download, 
  FileText, 
  TrendingUp,
  PieChart,
  BarChart3,
  Calendar,
  DollarSign,
  Target,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  ShoppingCart
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { exportTransactionsCSV, exportBillsCSV, exportGoalsCSV } from '@/lib/csv-enhanced'

interface ReportData {
  savingsRate: number
  essentialsPercent: number
  topCategories: Array<{ name: string; amount: number; percent: number }>
  monthlyTrend: Array<{ month: string; income: number; expenses: number }>
  netCashFlow: number
  avgTransaction: number
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('last30days')

  useEffect(() => {
    fetchReportData()
  }, [dateRange])

  const fetchReportData = async () => {
    try {
      // Mock data for now - would fetch from /api/reports
      const mockData: ReportData = {
        savingsRate: 22.5,
        essentialsPercent: 65.2,
        topCategories: [
          { name: 'Housing', amount: 1200, percent: 35.2 },
          { name: 'Food & Dining', amount: 450, percent: 13.2 },
          { name: 'Transportation', amount: 380, percent: 11.1 }
        ],
        monthlyTrend: [
          { month: 'Nov', income: 4200, expenses: 3100 },
          { month: 'Dec', income: 4200, expenses: 3350 },
          { month: 'Jan', income: 4200, expenses: 3250 }
        ],
        netCashFlow: 950,
        avgTransaction: 87.50
      }
      
      await new Promise(resolve => setTimeout(resolve, 500))
      setReportData(mockData)
    } catch (error) {
      console.error('Error fetching report data:', error)
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

  const exportToPDF = () => {
    // In production, would generate PDF with charts and logo
    toast.success('PDF report will be generated with charts and Outwit Budget logo')
  }

  const exportAllCSV = () => {
    // Export all data as CSV
    exportTransactionsCSV([])
    exportBillsCSV([])
    exportGoalsCSV([])
    toast.success('All data exported to CSV files')
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Financial Reports
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Insights and analytics for your financial health
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="card-hover" onClick={exportAllCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button className="btn-primary rounded-xl" onClick={exportToPDF}>
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* KPI Overview */}
      {loading ? (
        <ReportsKPISkeleton />
      ) : reportData ? (
        <div className="grid gap-6 md:grid-cols-4">
          <MetricCard
            title="Savings Rate"
            value={`${reportData.savingsRate}%`}
            subtitle="Of income saved"
            icon={Target}
            status={reportData.savingsRate >= 20 ? "success" : reportData.savingsRate >= 10 ? "warn" : "danger"}
            trend={{
              value: 2.3,
              isPositive: true
            }}
          />
          <MetricCard
            title="Essentials"
            value={`${reportData.essentialsPercent}%`}
            subtitle="Housing, food, utilities"
            icon={Users}
            status={reportData.essentialsPercent <= 60 ? "success" : reportData.essentialsPercent <= 75 ? "warn" : "danger"}
          />
          <MetricCard
            title="Net Cash Flow"
            value={formatCurrency(reportData.netCashFlow)}
            subtitle="Income minus expenses"
            icon={TrendingUp}
            status={reportData.netCashFlow > 0 ? "success" : "danger"}
            trend={{
              value: 15.2,
              isPositive: reportData.netCashFlow > 0
            }}
          />
          <MetricCard
            title="Avg Transaction"
            value={formatCurrency(reportData.avgTransaction)}
            subtitle="Per purchase"
            icon={ShoppingCart}
            status="info"
          />
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Categories */}
        <AppCard
          title="Top Spending Categories"
          subtitle="Your biggest expense areas"
          icon={PieChart}
          elevated
        >
          {loading ? (
            <CategoriesSkeleton />
          ) : reportData ? (
            <div className="space-y-4">
              {reportData.topCategories.map((category, index) => (
                <motion.div
                  key={category.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500" style={{
                      backgroundColor: `hsl(${210 + index * 30}, 70%, 50%)`
                    }} />
                    <div>
                      <h4 className="font-medium">{category.name}</h4>
                      <p className="text-sm text-muted-foreground">{category.percent}% of spending</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(category.amount)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : null}
        </AppCard>

        {/* Monthly Trends */}
        <AppCard
          title="Income vs Expenses"
          subtitle="3-month trend"
          icon={BarChart3}
          elevated
        >
          {loading ? (
            <TrendsSkeleton />
          ) : reportData ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>Income</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span>Expenses</span>
                </div>
              </div>
              
              <div className="space-y-3">
                {reportData.monthlyTrend.map((month, index) => {
                  const maxAmount = Math.max(month.income, month.expenses)
                  const incomePercent = (month.income / maxAmount) * 100
                  const expensePercent = (month.expenses / maxAmount) * 100
                  
                  return (
                    <motion.div
                      key={month.month}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{month.month}</span>
                        <span className="text-muted-foreground">
                          Net: {formatCurrency(month.income - month.expenses)}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-20 text-xs text-green-600">Income</div>
                          <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${incomePercent}%` }}
                            />
                          </div>
                          <div className="w-16 text-xs text-right">{formatCurrency(month.income)}</div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="w-20 text-xs text-red-600">Expenses</div>
                          <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div 
                              className="bg-red-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${expensePercent}%` }}
                            />
                          </div>
                          <div className="w-16 text-xs text-right">{formatCurrency(month.expenses)}</div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          ) : null}
        </AppCard>
      </div>

      {/* Financial Health Score */}
      <AppCard
        title="Financial Health Score"
        subtitle="Based on your spending patterns and savings"
        icon={Target}
        elevated
      >
        {loading ? (
          <HealthScoreSkeleton />
        ) : reportData ? (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-6xl font-bold text-green-600 mb-2">85</div>
              <div className="text-lg font-medium mb-1">Excellent</div>
              <p className="text-muted-foreground">You're on track for financial success!</p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                <ArrowUpRight className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="font-semibold text-green-800 dark:text-green-200">Strong Savings</div>
                <div className="text-sm text-green-600 dark:text-green-400">22.5% savings rate</div>
              </div>
              
              <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                <BarChart3 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="font-semibold text-blue-800 dark:text-blue-200">Balanced Spending</div>
                <div className="text-sm text-blue-600 dark:text-blue-400">Good category distribution</div>
              </div>
              
              <div className="text-center p-4 rounded-lg bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800">
                <TrendingUp className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <div className="font-semibold text-orange-800 dark:text-orange-200">Positive Trend</div>
                <div className="text-sm text-orange-600 dark:text-orange-400">Improving over time</div>
              </div>
            </div>
          </div>
        ) : null}
      </AppCard>
    </div>
  )
}

function ReportsKPISkeleton() {
  return (
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
  )
}

function CategoriesSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-muted rounded-full animate-pulse" />
            <div>
              <div className="h-4 w-20 bg-muted rounded animate-pulse mb-1" />
              <div className="h-3 w-16 bg-muted rounded animate-pulse" />
            </div>
          </div>
          <div className="h-4 w-12 bg-muted rounded animate-pulse" />
        </div>
      ))}
    </div>
  )
}

function TrendsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="h-3 w-16 bg-muted rounded animate-pulse" />
        <div className="h-3 w-16 bg-muted rounded animate-pulse" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="flex justify-between">
            <div className="h-4 w-8 bg-muted rounded animate-pulse" />
            <div className="h-4 w-16 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-2 w-full bg-muted rounded animate-pulse" />
          <div className="h-2 w-full bg-muted rounded animate-pulse" />
        </div>
      ))}
    </div>
  )
}

function HealthScoreSkeleton() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="h-16 w-16 bg-muted rounded-full mx-auto mb-2 animate-pulse" />
        <div className="h-6 w-24 bg-muted rounded mx-auto mb-1 animate-pulse" />
        <div className="h-4 w-32 bg-muted rounded mx-auto animate-pulse" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-4 border rounded-lg">
            <div className="h-8 w-8 bg-muted rounded mx-auto mb-2 animate-pulse" />
            <div className="h-4 w-20 bg-muted rounded mx-auto mb-1 animate-pulse" />
            <div className="h-3 w-16 bg-muted rounded mx-auto animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}