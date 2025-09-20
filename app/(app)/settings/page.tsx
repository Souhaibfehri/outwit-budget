'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Settings,
  User,
  Bell,
  Shield,
  Download,
  Trash2,
  LogOut,
  Mail,
  Smartphone,
  Globe,
  Moon,
  Sun,
  Palette
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ThemeToggle } from '@/components/marketing/theme-toggle'

interface UserProfile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  phone?: string
  timezone: string
  currency: string
  notifications: {
    email: boolean
    push: boolean
    bills: boolean
    goals: boolean
    budgetAlerts: boolean
  }
}

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const supabase = createClient()
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        toast.error('Failed to load user data')
        return
      }

      setUser(authUser)

      // Load user profile from metadata
      const userProfile: UserProfile = {
        id: authUser?.id || '',
        email: authUser?.email || '',
        full_name: authUser?.user_metadata?.full_name || authUser?.user_metadata?.name || '',
        avatar_url: authUser?.user_metadata?.avatar_url,
        phone: authUser?.user_metadata?.phone,
        timezone: authUser?.user_metadata?.timezone || 'America/New_York',
        currency: authUser?.user_metadata?.currency || 'USD',
        notifications: {
          email: authUser?.user_metadata?.notifications?.email ?? true,
          push: authUser?.user_metadata?.notifications?.push ?? true,
          bills: authUser?.user_metadata?.notifications?.bills ?? true,
          goals: authUser?.user_metadata?.notifications?.goals ?? true,
          budgetAlerts: authUser?.user_metadata?.notifications?.budgetAlerts ?? true,
        }
      }

      setProfile(userProfile)
    } catch (error) {
      console.error('Error loading user data:', error)
      toast.error('Failed to load user data')
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return

    setSaving(true)
    try {
      const supabase = createClient()
      
      const { error } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          ...updates,
          notifications: updates.notifications || profile.notifications
        }
      })

      if (error) throw error

      setProfile(prev => prev ? { ...prev, ...updates } : null)
      toast.success('Settings updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update settings')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error('Failed to sign out')
    }
  }

  const exportData = async () => {
    try {
      // In a real app, this would call an API to generate and download user data
      toast.success('Data export feature coming soon!')
    } catch (error) {
      toast.error('Failed to export data')
    }
  }

  const deleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return
    }

    try {
      // In a real app, this would call an API to delete the account
      toast.error('Account deletion feature coming soon. Please contact support.')
    } catch (error) {
      toast.error('Failed to delete account')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="space-y-6">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="grid gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-6">
                <div className="space-y-4">
                  <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Settings</h1>
          <p className="text-muted-foreground">Failed to load user profile.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-8 w-8 text-orange-600" />
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={profile.full_name}
                  onChange={(e) => setProfile(prev => prev ? { ...prev, full_name: e.target.value } : null)}
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={profile.email}
                  disabled
                  className="bg-gray-50 dark:bg-gray-800"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Contact support to change your email address
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  value={profile.timezone}
                  onChange={(e) => setProfile(prev => prev ? { ...prev, timezone: e.target.value } : null)}
                  placeholder="America/New_York"
                />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  value={profile.currency}
                  onChange={(e) => setProfile(prev => prev ? { ...prev, currency: e.target.value } : null)}
                  placeholder="USD"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={() => updateProfile({
                  full_name: profile.full_name,
                  timezone: profile.timezone,
                  currency: profile.currency
                })}
                disabled={saving}
                className="btn-primary"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive important updates via email
                  </p>
                </div>
                <Switch
                  checked={profile.notifications.email}
                  onCheckedChange={(checked) => 
                    setProfile(prev => prev ? {
                      ...prev,
                      notifications: { ...prev.notifications, email: checked }
                    } : null)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Bill Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about upcoming bills
                  </p>
                </div>
                <Switch
                  checked={profile.notifications.bills}
                  onCheckedChange={(checked) => 
                    setProfile(prev => prev ? {
                      ...prev,
                      notifications: { ...prev.notifications, bills: checked }
                    } : null)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Goal Milestones</Label>
                  <p className="text-sm text-muted-foreground">
                    Celebrate when you reach savings goals
                  </p>
                </div>
                <Switch
                  checked={profile.notifications.goals}
                  onCheckedChange={(checked) => 
                    setProfile(prev => prev ? {
                      ...prev,
                      notifications: { ...prev.notifications, goals: checked }
                    } : null)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Budget Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get warned when approaching budget limits
                  </p>
                </div>
                <Switch
                  checked={profile.notifications.budgetAlerts}
                  onCheckedChange={(checked) => 
                    setProfile(prev => prev ? {
                      ...prev,
                      notifications: { ...prev.notifications, budgetAlerts: checked }
                    } : null)
                  }
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={() => updateProfile({ notifications: profile.notifications })}
                disabled={saving}
                className="btn-primary"
              >
                {saving ? 'Saving...' : 'Save Notifications'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Theme</Label>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred color scheme
                </p>
              </div>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy & Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Export Data</Label>
                <p className="text-sm text-muted-foreground">
                  Download a copy of your financial data
                </p>
              </div>
              <Button variant="outline" onClick={exportData}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base text-red-600">Delete Account</Label>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
              <Button variant="destructive" onClick={deleteAccount}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Sign Out</Label>
                <p className="text-sm text-muted-foreground">
                  Sign out of your account on this device
                </p>
              </div>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
