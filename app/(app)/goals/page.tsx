'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { AppCard, MetricCard } from '@/components/ui/app-card'
import { 
  Plus,
  Target,
  Calendar,
  DollarSign,
  TrendingUp,
  Edit,
  Trash2,
  CheckCircle,
  Star,
  PiggyBank,
  Zap,
  Bell,
  BellOff,
  Download
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { getUserData, updateUserData, addGoal, updateGoal } from '@/lib/user-data'
import { exportGoalsCSV } from '@/lib/csv-enhanced'

interface Goal {
  id: string
  name: string
  targetCents: number
  savedCents: number
  targetDate?: string
  notify: boolean
  priority: number
  createdAt: string
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showAddMoneyModal, setShowAddMoneyModal] = useState<Goal | null>(null)
  
  // New goal form state
  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: '',
    targetDate: '',
    priority: 3,
    notify: true
  })

  useEffect(() => {
    fetchGoals()
  }, [])

  const fetchGoals = async () => {
    try {
      // Fetch real user data from Supabase
      const userData = await getUserData()
      
      // Convert user goals to component format
      const userGoals: Goal[] = userData.goals.map(goal => ({
        id: goal.id,
        name: goal.name,
        targetCents: goal.targetCents,
        savedCents: goal.savedCents,
        targetDate: goal.targetDate,
        notify: true, // Default to true for notifications
        priority: goal.priority,
        createdAt: new Date().toISOString() // Would store actual creation date
      }))
      
      setGoals(userGoals)
    } catch (error) {
      console.error('Error fetching goals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGoal = async () => {
    if (!newGoal.name || !newGoal.targetAmount) {
      toast.error('Please fill in goal name and target amount')
      return
    }

    try {
      await addGoal({
        name: newGoal.name,
        targetCents: Math.round(parseFloat(newGoal.targetAmount) * 100),
        targetDate: newGoal.targetDate || undefined,
        priority: newGoal.priority,
        notify: newGoal.notify
      })
      
      toast.success('Goal created successfully!')
      setShowAddModal(false)
      setNewGoal({ name: '', targetAmount: '', targetDate: '', priority: 3, notify: true })
      fetchGoals()
    } catch (error) {
      console.error('Error creating goal:', error)
      toast.error('Failed to create goal. Please try again.')
    }
  }

  const calculateStats = () => {
    const totalTargetAmount = goals.reduce((sum, goal) => sum + goal.targetCents, 0)
    const totalSavedAmount = goals.reduce((sum, goal) => sum + goal.savedCents, 0)
    const completedGoals = goals.filter(goal => goal.savedCents >= goal.targetCents).length
    const avgProgress = goals.length > 0 
      ? goals.reduce((sum, goal) => sum + (goal.savedCents / goal.targetCents), 0) / goals.length * 100
      : 0

    return { totalTargetAmount, totalSavedAmount, completedGoals, avgProgress }
  }

  const handleAddMoney = async (goalId: string, amount: number) => {
    try {
      // Update real user data
      const success = await updateGoal(goalId, {
        savedCents: goals.find(g => g.id === goalId)!.savedCents + (amount * 100)
      })

      if (success) {
        // Update local state
        setGoals(prev => prev.map(goal => 
          goal.id === goalId 
            ? { ...goal, savedCents: goal.savedCents + (amount * 100) }
            : goal
        ))
        toast.success(`$${amount} added to goal!`)
        setShowAddMoneyModal(null)
      } else {
        toast.error('Failed to add money to goal')
      }
    } catch (error) {
      console.error('Error adding money to goal:', error)
      toast.error('Failed to add money to goal')
    }
  }

  const handleDeleteGoal = (goalId: string) => {
    setGoals(prev => prev.filter(goal => goal.id !== goalId))
    toast.success('Goal deleted!')
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(cents / 100)
  }

  const calculateProgress = (saved: number, target: number) => {
    return Math.min(100, (saved / target) * 100)
  }

  const getDaysToTarget = (targetDate?: string) => {
    if (!targetDate) return null
    const target = new Date(targetDate)
    const today = new Date()
    const diffTime = target.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const { totalTargetAmount, totalSavedAmount, completedGoals, avgProgress } = calculateStats()

  if (loading) {
    return <GoalsSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Goals & Savings
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Track your progress toward financial goals
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="card-hover" onClick={() => exportGoalsCSV(goals)}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button 
            className="btn-primary rounded-xl"
            onClick={() => setShowAddModal(true)}
            data-testid="add-goal-btn"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Goal
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6" data-testid="goals-kpis">
        <MetricCard
          title="Total Target"
          value={formatCurrency(totalTargetAmount)}
          subtitle="All goal targets"
          icon={Target}
          status="info"
        />
        <MetricCard
          title="Total Saved"
          value={formatCurrency(totalSavedAmount)}
          subtitle="Progress so far"
          icon={PiggyBank}
          status="success"
          trend={{
            value: 15.2,
            isPositive: true
          }}
        />
        <MetricCard
          title="Completed Goals"
          value={completedGoals.toString()}
          subtitle="Achieved targets"
          icon={CheckCircle}
          status={completedGoals > 0 ? "success" : "info"}
        />
        <MetricCard
          title="Avg Progress"
          value={`${avgProgress.toFixed(1)}%`}
          subtitle="Across all goals"
          icon={TrendingUp}
          status={avgProgress >= 75 ? "success" : avgProgress >= 50 ? "warn" : "info"}
        />
      </div>

      {/* Goals List */}
      <AppCard
        title={`Your Goals (${goals.length})`}
        subtitle="Track and achieve your financial objectives"
        icon={Target}
        elevated
      >
        {goals.length === 0 ? (
          <div className="text-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">No goals set</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Start saving for your dreams! Set your first financial goal.
            </p>
            <Button 
              className="btn-primary rounded-xl"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Goal
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {goals
              .sort((a, b) => a.priority - b.priority)
              .map((goal, index) => {
                const progress = calculateProgress(goal.savedCents, goal.targetCents)
                const isCompleted = goal.savedCents >= goal.targetCents
                const daysToTarget = getDaysToTarget(goal.targetDate)
                
                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
                      isCompleted 
                        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30'
                        : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/50'
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`p-3 rounded-lg ${
                            isCompleted 
                              ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                              : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                          }`}>
                            {isCompleted ? <CheckCircle className="h-5 w-5" /> : <Target className="h-5 w-5" />}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg">{goal.name}</h3>
                              <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-3 w-3 ${
                                      star <= goal.priority 
                                        ? 'text-yellow-400 fill-current' 
                                        : 'text-gray-300 dark:text-gray-600'
                                    }`}
                                  />
                                ))}
                              </div>
                              {goal.notify && (
                                <Badge variant="outline" className="text-xs">
                                  <Bell className="h-3 w-3 mr-1" />
                                  Notifications
                                </Badge>
                              )}
                              {isCompleted && (
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  Completed! 🎉
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                              <span>{formatCurrency(goal.savedCents)} of {formatCurrency(goal.targetCents)}</span>
                              {goal.targetDate && (
                                <>
                                  <span>•</span>
                                  <span>Target: {new Date(goal.targetDate).toLocaleDateString()}</span>
                                  {daysToTarget && (
                                    <>
                                      <span>•</span>
                                      <span className={daysToTarget < 30 ? 'text-orange-600' : ''}>
                                        {daysToTarget > 0 ? `${daysToTarget} days left` : `${Math.abs(daysToTarget)} days overdue`}
                                      </span>
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">{progress.toFixed(1)}% Complete</span>
                                <span className="text-muted-foreground">
                                  {formatCurrency(goal.targetCents - goal.savedCents)} remaining
                                </span>
                              </div>
                              <Progress 
                                value={progress} 
                                className={`h-3 ${isCompleted ? 'bg-green-100 dark:bg-green-900' : ''}`}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {!isCompleted && (
                            <Button 
                              size="sm" 
                              className="btn-primary"
                              onClick={() => setShowAddMoneyModal(goal)}
                              data-testid="add-money-btn"
                            >
                              <DollarSign className="h-4 w-4 mr-1" />
                              Add Money
                            </Button>
                          )}
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteGoal(goal.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
          </div>
        )}
      </AppCard>

      {/* Add Goal Modal */}
      {showAddModal && (
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
              <DialogDescription>
                Set a savings target and track your progress toward achieving it.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="goal-name">Goal Name</Label>
                <Input 
                  id="goal-name" 
                  placeholder="e.g., Emergency Fund, Vacation, New Car"
                  value={newGoal.name}
                  onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                />
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="target-amount">Target Amount</Label>
                  <Input 
                    id="target-amount" 
                    type="number" 
                    placeholder="5000"
                    value={newGoal.targetAmount}
                    onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target-date">Target Date (Optional)</Label>
                  <Input 
                    id="target-date" 
                    type="date"
                    value={newGoal.targetDate}
                    onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Enable Notifications</div>
                    <div className="text-sm text-muted-foreground">Get reminders about this goal</div>
                  </div>
                  <Switch 
                    checked={newGoal.notify}
                    onCheckedChange={(checked) => setNewGoal({ ...newGoal, notify: checked })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Priority Level</Label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <Button
                        key={level}
                        variant={newGoal.priority >= level ? "default" : "outline"}
                        size="sm"
                        className={`w-8 h-8 p-0 transition-all ${
                          newGoal.priority >= level 
                            ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500' 
                            : 'hover:bg-orange-50 hover:border-orange-300'
                        }`}
                        onClick={() => setNewGoal({ ...newGoal, priority: level })}
                      >
                        <Star className={`h-3 w-3 ${newGoal.priority >= level ? 'fill-current' : ''}`} />
                      </Button>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500">
                    {newGoal.priority === 1 && "⭐ Low priority"}
                    {newGoal.priority === 2 && "⭐⭐ Below average"}
                    {newGoal.priority === 3 && "⭐⭐⭐ Average priority"}
                    {newGoal.priority === 4 && "⭐⭐⭐⭐ High priority"}
                    {newGoal.priority === 5 && "⭐⭐⭐⭐⭐ Critical priority"}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button 
                className="btn-primary"
                onClick={handleCreateGoal}
                disabled={!newGoal.name || !newGoal.targetAmount}
              >
                Create Goal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Money Modal */}
      {showAddMoneyModal && (
        <Dialog open={!!showAddMoneyModal} onOpenChange={() => setShowAddMoneyModal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Money to Goal</DialogTitle>
              <DialogDescription>
                Add money to "{showAddMoneyModal.name}" goal
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Current Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {formatCurrency(showAddMoneyModal.savedCents)} / {formatCurrency(showAddMoneyModal.targetCents)}
                  </span>
                </div>
                <Progress value={calculateProgress(showAddMoneyModal.savedCents, showAddMoneyModal.targetCents)} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount">Amount to Add</Label>
                <Input 
                  id="amount" 
                  type="number" 
                  placeholder="100"
                  autoFocus
                />
              </div>
              
              <div className="space-y-2">
                <Label>Quick Amounts</Label>
                <div className="flex gap-2">
                  {[25, 50, 100, 250].map(amount => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const input = document.getElementById('amount') as HTMLInputElement
                        if (input) input.value = amount.toString()
                      }}
                    >
                      ${amount}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddMoneyModal(null)}>
                Cancel
              </Button>
              <Button 
                className="btn-primary"
                onClick={() => {
                  const input = document.getElementById('amount') as HTMLInputElement
                  const amount = parseFloat(input?.value || '0')
                  if (amount > 0) {
                    handleAddMoney(showAddMoneyModal.id, amount)
                  }
                }}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Add Money
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function GoalsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-10 w-48 bg-muted rounded animate-pulse" />
          <div className="h-6 w-64 bg-muted rounded animate-pulse mt-2" />
        </div>
        <div className="flex gap-3">
          <div className="h-9 w-24 bg-muted rounded animate-pulse" />
          <div className="h-9 w-24 bg-muted rounded animate-pulse" />
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
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 border rounded-lg">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-muted rounded-lg animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-48 bg-muted rounded animate-pulse" />
                  <div className="h-2 w-full bg-muted rounded animate-pulse" />
                </div>
                <div className="h-8 w-20 bg-muted rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
