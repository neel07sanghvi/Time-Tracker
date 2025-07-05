'use client'

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@time-tracker/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@time-tracker/ui/card"
import { Input } from "@time-tracker/ui/input"
import { Label } from "@time-tracker/ui/label"
import { database } from "@time-tracker/api"

export default function ActivatePage() {
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [employee, setEmployee] = useState<any>(null)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  useEffect(() => {
    if (token && email) {
      verifyToken()
    } else {
      setError("Invalid activation link")
      setVerifying(false)
    }
  }, [token, email])

  const verifyToken = async () => {
    try {
      const { data, error } = await database.getEmployeeByActivationToken(token!)
      
      if (error || !data || data.length === 0) {
        setError("Invalid or expired activation token")
        setVerifying(false)
        return
      }

      const employeeData = data[0]
      
      if (employeeData.email !== email) {
        setError("Email does not match activation token")
        setVerifying(false)
        return
      }

      if (employeeData.status === 'active') {
        setError("This account has already been activated")
        setVerifying(false)
        return
      }

      setEmployee(employeeData)
      setVerifying(false)
    } catch (err) {
      console.error('Token verification failed:', err)
      setError("Failed to verify activation token")
      setVerifying(false)
    }
  }

  const handleActivation = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)

    try {
      // Update employee status and clear activation token
      const { data, error } = await database.activateEmployee(employee.id, password)
      
      if (error) {
        setError("Failed to activate account. Please try again.")
        setLoading(false)
        return
      }

      alert("Account activated successfully! You can now log in.")
      router.push('/login')
    } catch (err) {
      console.error('Activation failed:', err)
      setError("Failed to activate account. Please try again.")
      setLoading(false)
    }
  }

  if (verifying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p>Verifying activation token...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Activation Failed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <p className="text-muted-foreground text-sm">
                Please contact your administrator for a new activation link.
              </p>
            </div>
            <div className="text-center">
              <Button onClick={() => router.push('/login')} variant="outline">
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Activate Your Account</CardTitle>
          <p className="text-center text-muted-foreground">
            Welcome {employee?.name}! Set up your password to complete activation.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleActivation} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={employee?.email || ""}
                disabled
                className="bg-muted"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <p className="text-xs text-muted-foreground">
                Password must be at least 8 characters long
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Activating..." : "Activate Account"}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              By activating your account, you agree to our terms of service and privacy policy.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}