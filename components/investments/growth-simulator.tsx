'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Target, 
  AlertCircle,
  Info,
  Zap,
  Calculator,
  PiggyBank,
  Trophy
} from 'lucide-react'
import { motion } from 'framer-motion'

interface SimulationData {
  year: number
  age: number
  totalContributions: number
  totalInterest: number
  totalValue: number
  monthlyContribution: number
  annualReturn: number
}

interface ScenarioComparison {
  name: string
  monthlyContribution: number
  years: number
  finalValue: number
  totalContributions: number
  totalInterest: number
  color: string
}

export function GrowthSimulator() {
  const [initialAmount, setInitialAmount] = useState(1000)
  const [monthlyContribution, setMonthlyContribution] = useState(500)
  const [annualReturn, setAnnualReturn] = useState(7)
  const [years, setYears] = useState(30)
  const [currentAge, setCurrentAge] = useState(25)
  const [inflationRate, setInflationRate] = useState(2.5)
  const [selectedScenario, setSelectedScenario] = useState<string>('conservative')

  // Investment scenarios
  const scenarios = {
    conservative: { return: 5, risk: 'Low', description: 'Bonds, CDs, Conservative Funds' },
    moderate: { return: 7, risk: 'Medium', description: 'Index Funds, Balanced Portfolio' },
    aggressive: { return: 10, risk: 'High', description: 'Growth Stocks, Tech ETFs' },
    crypto: { return: 15, risk: 'Very High', description: 'Cryptocurrency, High Risk' }
  }

  // Calculate compound growth
  const simulationData = useMemo(() => {
    const data: SimulationData[] = []
    let totalValue = initialAmount
    let totalContributions = initialAmount
    
    for (let year = 0; year <= years; year++) {
      if (year > 0) {
        // Add monthly contributions for the year
        const yearlyContributions = monthlyContribution * 12
        totalContributions += yearlyContributions
        totalValue += yearlyContributions
        
        // Apply annual return
        totalValue *= (1 + annualReturn / 100)
      }
      
      const totalInterest = totalValue - totalContributions
      
      data.push({
        year,
        age: currentAge + year,
        totalContributions,
        totalInterest,
        totalValue,
        monthlyContribution,
        annualReturn
      })
    }
    
    return data
  }, [initialAmount, monthlyContribution, annualReturn, years, currentAge])

  // Scenario comparisons
  const scenarioComparisons = useMemo(() => {
    const comparisons: ScenarioComparison[] = []
    const colors = ['#ef4444', '#f97316', '#22c55e', '#8b5cf6']
    
    Object.entries(scenarios).forEach(([key, scenario], index) => {
      let value = initialAmount
      let contributions = initialAmount
      
      for (let year = 1; year <= years; year++) {
        contributions += monthlyContribution * 12
        value += monthlyContribution * 12
        value *= (1 + scenario.return / 100)
      }
      
      comparisons.push({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        monthlyContribution,
        years,
        finalValue: value,
        totalContributions: contributions,
        totalInterest: value - contributions,
        color: colors[index]
      })
    })
    
    return comparisons
  }, [initialAmount, monthlyContribution, years])

  // Calculate inflation-adjusted values
  const inflationAdjustedValue = useMemo(() => {
    const finalValue = simulationData[simulationData.length - 1]?.totalValue || 0
    return finalValue / Math.pow(1 + inflationRate / 100, years)
  }, [simulationData, inflationRate, years])

  // Calculate retirement readiness
  const retirementReadiness = useMemo(() => {
    const finalValue = simulationData[simulationData.length - 1]?.totalValue || 0
    const retirementAge = currentAge + years
    const yearsInRetirement = 85 - retirementAge
    const annualWithdrawal = finalValue * 0.04 // 4% rule
    const monthlyIncome = annualWithdrawal / 12
    
    return {
      finalValue,
      retirementAge,
      yearsInRetirement,
      annualWithdrawal,
      monthlyIncome,
      replacementRatio: monthlyIncome / (monthlyContribution * 12 / 12)
    }
  }, [simulationData, currentAge, years, monthlyContribution])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatPercent = (value: number) => `${value.toFixed(1)}%`

  return (
    <div className="space-y-6" data-testid="growth-simulator">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
          <Calculator className="h-6 w-6 text-orange-500" />
          Investment Growth Simulator
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          See the power of compound interest and plan your financial future
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Controls */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" />
              Simulation Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="initial">Initial Investment</Label>
                <Input
                  id="initial"
                  type="number"
                  value={initialAmount}
                  onChange={(e) => setInitialAmount(Number(e.target.value))}
                  min="0"
                  step="100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthly">Monthly Contribution</Label>
                <Input
                  id="monthly"
                  type="number"
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                  min="0"
                  step="50"
                />
              </div>
            </div>

            {/* Age and years */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Current Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={currentAge}
                  onChange={(e) => setCurrentAge(Number(e.target.value))}
                  min="18"
                  max="65"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="years">Investment Years</Label>
                <Input
                  id="years"
                  type="number"
                  value={years}
                  onChange={(e) => setYears(Number(e.target.value))}
                  min="1"
                  max="50"
                />
              </div>
            </div>

            {/* Return rate slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Annual Return Rate</Label>
                <Badge variant="outline" className="font-mono">
                  {formatPercent(annualReturn)}
                </Badge>
              </div>
              <Slider
                value={[annualReturn]}
                onValueChange={(value) => setAnnualReturn(value[0])}
                min={1}
                max={20}
                step={0.5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>1% (Very Safe)</span>
                <span>20% (Very Risky)</span>
              </div>
            </div>

            {/* Inflation rate */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Inflation Rate</Label>
                <Badge variant="outline" className="font-mono">
                  {formatPercent(inflationRate)}
                </Badge>
              </div>
              <Slider
                value={[inflationRate]}
                onValueChange={(value) => setInflationRate(value[0])}
                min={0}
                max={10}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Quick scenario buttons */}
            <div className="space-y-2">
              <Label>Quick Scenarios</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(scenarios).map(([key, scenario]) => (
                  <Button
                    key={key}
                    variant={selectedScenario === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedScenario(key)
                      setAnnualReturn(scenario.return)
                    }}
                    className="text-xs"
                  >
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                    <br />
                    <span className="text-xs opacity-70">{scenario.return}%</span>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Growth Projection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="chart">Growth Chart</TabsTrigger>
                <TabsTrigger value="scenarios">Compare</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                {/* Key metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(simulationData[simulationData.length - 1]?.totalValue || 0)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Final Value
                    </div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(simulationData[simulationData.length - 1]?.totalInterest || 0)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Interest Earned
                    </div>
                  </div>
                </div>

                {/* Retirement analysis */}
                <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg space-y-2">
                  <h4 className="font-semibold text-purple-800 dark:text-purple-200 flex items-center gap-2">
                    <PiggyBank className="h-4 w-4" />
                    Retirement Analysis
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600 dark:text-gray-400">Retirement Age</div>
                      <div className="font-semibold">{retirementReadiness.retirementAge}</div>
                    </div>
                    <div>
                      <div className="text-gray-600 dark:text-gray-400">Monthly Income</div>
                      <div className="font-semibold">{formatCurrency(retirementReadiness.monthlyIncome)}</div>
                    </div>
                  </div>
                  <div className="text-xs text-purple-600 dark:text-purple-400">
                    Based on 4% withdrawal rule
                  </div>
                </div>

                {/* Inflation impact */}
                <div className="p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                  <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">
                    Inflation Impact
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Nominal Value:</span>
                      <span className="font-semibold">{formatCurrency(simulationData[simulationData.length - 1]?.totalValue || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Real Value (Today's $):</span>
                      <span className="font-semibold">{formatCurrency(inflationAdjustedValue)}</span>
                    </div>
                    <div className="text-xs text-orange-600 dark:text-orange-400">
                      Adjusted for {formatPercent(inflationRate)} inflation
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="chart">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={simulationData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="year" 
                        label={{ value: 'Years', position: 'insideBottom', offset: -5 }}
                      />
                      <YAxis 
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        label={{ value: 'Value', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        formatter={(value: number, name: string) => [formatCurrency(value), name]}
                        labelFormatter={(year) => `Year ${year} (Age ${currentAge + year})`}
                      />
                      <Area
                        type="monotone"
                        dataKey="totalContributions"
                        stackId="1"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.6}
                        name="Contributions"
                      />
                      <Area
                        type="monotone"
                        dataKey="totalInterest"
                        stackId="1"
                        stroke="#22c55e"
                        fill="#22c55e"
                        fillOpacity={0.8}
                        name="Interest Growth"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              <TabsContent value="scenarios">
                <div className="space-y-4">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={scenarioComparisons}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Bar dataKey="finalValue" fill="#ff8c42" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="grid gap-3">
                    {scenarioComparisons.map((scenario, index) => (
                      <motion.div
                        key={scenario.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: scenario.color }}
                          />
                          <div>
                            <div className="font-medium">{scenario.name}</div>
                            <div className="text-xs text-gray-500">
                              {scenarios[scenario.name.toLowerCase() as keyof typeof scenarios]?.risk} Risk
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{formatCurrency(scenario.finalValue)}</div>
                          <div className="text-xs text-gray-500">
                            +{formatCurrency(scenario.totalInterest)}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Advanced insights */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {((simulationData[simulationData.length - 1]?.totalInterest || 0) / (simulationData[simulationData.length - 1]?.totalContributions || 1) * 100).toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Return on Investment
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {Math.ceil((simulationData[simulationData.length - 1]?.totalValue || 0) / 1000000)} Million
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Millionaire in {years} years
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {formatPercent(retirementReadiness.replacementRatio * 100)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Income Replacement
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Educational insights */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200">
                💡 Key Insights
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Starting early is more powerful than contributing more later</li>
                <li>• A 1% increase in return rate can add hundreds of thousands over time</li>
                <li>• Consistency beats timing - regular contributions compound exponentially</li>
                <li>• Inflation reduces purchasing power - invest to stay ahead</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex gap-3 justify-center">
        <Button className="btn-primary">
          <PiggyBank className="h-4 w-4 mr-2" />
          Create Investment Plan
        </Button>
        <Button variant="outline">
          <Calculator className="h-4 w-4 mr-2" />
          Save Simulation
        </Button>
      </div>
    </div>
  )
}
