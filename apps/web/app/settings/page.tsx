'use client'

import { useState, useEffect } from "react"
import { useAuth } from "../../hooks/useAuth"
import { Button } from "@time-tracker/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@time-tracker/ui/card"
import { Input } from "@time-tracker/ui/input"
import { Label } from "@time-tracker/ui/label"
import Link from "next/link"

export default function SettingsPage() {
  const { user, loading: authLoading, logout } = useAuth()
  const [settings, setSettings] = useState({
    screenshot_interval: 10,
    activity_tracking: true,
    email_notifications: true,
    daily_reports: false,
    timezone: 'UTC',
    work_hours_start: '09:00',
    work_hours_end: '17:00',
    idle_timeout: 15,
    blur_screenshots: false
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    // In a real app, this would fetch from the database
    // For now, we'll use localStorage to persist settings
    try {
      const savedSettings = localStorage.getItem('timeTrackerSettings')
      if (savedSettings) {
        setSettings({ ...settings, ...JSON.parse(savedSettings) })
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // In a real app, this would save to the database
      localStorage.setItem('timeTrackerSettings', JSON.stringify(settings))
      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert('Failed to save settings. Please try again.')
    }

    setSaving(false)
  }

  const handleResetSettings = () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      setSettings({
        screenshot_interval: 10,
        activity_tracking: true,
        email_notifications: true,
        daily_reports: false,
        timezone: 'UTC',
        work_hours_start: '09:00',
        work_hours_end: '17:00',
        idle_timeout: 15,
        blur_screenshots: false
      })
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Configure your time tracking application</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard">
              <Button variant="outline">← Back to Dashboard</Button>
            </Link>
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Monitoring Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="screenshot_interval">Screenshot Interval (minutes)</Label>
                  <Input
                    id="screenshot_interval"
                    type="number"
                    min="1"
                    max="60"
                    value={settings.screenshot_interval}
                    onChange={(e) => setSettings({
                      ...settings, 
                      screenshot_interval: parseInt(e.target.value) || 10
                    })}
                  />
                  <p className="text-sm text-muted-foreground">
                    How often to capture screenshots (1-60 minutes)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="idle_timeout">Idle Timeout (minutes)</Label>
                  <Input
                    id="idle_timeout"
                    type="number"
                    min="5"
                    max="120"
                    value={settings.idle_timeout}
                    onChange={(e) => setSettings({
                      ...settings, 
                      idle_timeout: parseInt(e.target.value) || 15
                    })}
                  />
                  <p className="text-sm text-muted-foreground">
                    When to mark user as idle (5-120 minutes)
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="activity_tracking"
                    checked={settings.activity_tracking}
                    onChange={(e) => setSettings({
                      ...settings, 
                      activity_tracking: e.target.checked
                    })}
                    className="rounded"
                  />
                  <Label htmlFor="activity_tracking" className="text-sm font-normal">
                    Enable activity tracking
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="blur_screenshots"
                    checked={settings.blur_screenshots}
                    onChange={(e) => setSettings({
                      ...settings, 
                      blur_screenshots: e.target.checked
                    })}
                    className="rounded"
                  />
                  <Label htmlFor="blur_screenshots" className="text-sm font-normal">
                    Blur sensitive content in screenshots
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Work Hours</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    value={settings.timezone}
                    onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                    <option value="Asia/Shanghai">Shanghai</option>
                    <option value="Asia/Kolkata">India</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="work_hours_start">Work Start Time</Label>
                  <Input
                    id="work_hours_start"
                    type="time"
                    value={settings.work_hours_start}
                    onChange={(e) => setSettings({
                      ...settings, 
                      work_hours_start: e.target.value
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="work_hours_end">Work End Time</Label>
                  <Input
                    id="work_hours_end"
                    type="time"
                    value={settings.work_hours_end}
                    onChange={(e) => setSettings({
                      ...settings, 
                      work_hours_end: e.target.value
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="email_notifications"
                  checked={settings.email_notifications}
                  onChange={(e) => setSettings({
                    ...settings, 
                    email_notifications: e.target.checked
                  })}
                  className="rounded"
                />
                <Label htmlFor="email_notifications" className="text-sm font-normal">
                  Enable email notifications
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="daily_reports"
                  checked={settings.daily_reports}
                  onChange={(e) => setSettings({
                    ...settings, 
                    daily_reports: e.target.checked
                  })}
                  className="rounded"
                />
                <Label htmlFor="daily_reports" className="text-sm font-normal">
                  Send daily productivity reports
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Current Email</Label>
                  <div className="px-3 py-2 border border-input bg-muted rounded-md text-sm">
                    {user?.email || 'Not available'}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Account Type</Label>
                  <div className="px-3 py-2 border border-input bg-muted rounded-md text-sm">
                    Administrator
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={handleResetSettings}>
              Reset to Defaults
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}