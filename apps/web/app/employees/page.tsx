'use client'

import { useState, useEffect } from "react"
import { Button } from "@time-tracker/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@time-tracker/ui/card"
import { Input } from "@time-tracker/ui/input"
import { Label } from "@time-tracker/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@time-tracker/ui/table"
import { database } from "@time-tracker/api"
import { Employee } from "@time-tracker/db"
import Link from "next/link"
import { useAuth } from "../../hooks/useAuth"

export default function EmployeesPage() {
  const { user, loading: authLoading, logout } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [addingEmployee, setAddingEmployee] = useState(false)
  const [resendingEmail, setResendingEmail] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [newEmployee, setNewEmployee] = useState({ name: "", email: "" })

  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    try {
      const { data, error } = await database.getEmployees()
      if (data) {
        setEmployees(data)
      }
      if (error) {
        console.error('Error loading employees:', error)
      }
    } catch (err) {
      console.error('Failed to load employees:', err)
    }
    setLoading(false)
  }

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddingEmployee(true)

    const activationToken = crypto.randomUUID()
    const { data, error } = await database.createEmployee({
      ...newEmployee,
      activation_token: activationToken
    })

    if (data) {
      // Send invitation email
      const activationLink = `${window.location.origin}/activate?token=${activationToken}&email=${encodeURIComponent(newEmployee.email)}`

      try {
        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: newEmployee.email,
            subject: 'Welcome to Mercor Time Tracker - Account Activation',
            name: newEmployee.name,
            html: `
              <h2>Welcome to Mercor Time Tracker!</h2>
              <p>Hello ${newEmployee.name},</p>
              <p>You have been invited to join our time tracking platform. Please click the link below to activate your account and set up your password:</p>
              <p><a href="${activationLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Activate Account</a></p>
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p>${activationLink}</p>
              <p>This link will expire in 24 hours.</p>
              <p>Best regards,<br>The Mercor Team</p>
            `
          })
        })

        if (response.ok) {
          alert('Employee added and invitation email sent successfully!')
        } else {
          const errorData = await response.json()
          console.error('Email error:', errorData)
          alert(`Employee added but failed to send invitation email: ${errorData.error || 'Unknown error'}`)
        }
      } catch (emailError) {
        console.error('Failed to send email:', emailError)
        alert('Employee added but failed to send invitation email. Please send the activation link manually.')
      }

      setEmployees([...employees, data[0]])
      setNewEmployee({ name: "", email: "" })
      setShowAddForm(false)
    }
    setAddingEmployee(false)
  }

  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEmployee) return

    const { data, error } = await database.updateEmployee(editingEmployee.id, {
      name: editingEmployee.name,
      email: editingEmployee.email
    })

    if (data) {
      setEmployees(employees.map(emp =>
        emp.id === editingEmployee.id ? data[0] : emp
      ))
      setEditingEmployee(null)
    }
  }

  const handleDeleteEmployee = async (id: string) => {
    if (confirm("Are you sure you want to delete this employee?")) {
      const { error } = await database.deleteEmployee(id)
      if (!error) {
        setEmployees(employees.filter(emp => emp.id !== id))
      }
    }
  }

  const handleResendInvitation = async (e: React.MouseEvent, employee: Employee) => {
    e.preventDefault()
    e.stopPropagation()

    if (!employee.activation_token) {
      alert("No activation token found for this employee")
      return
    }

    setResendingEmail(employee.id)
    const activationLink = `${window.location.origin}/activate?token=${employee.activation_token}&email=${encodeURIComponent(employee.email)}`

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: employee.email,
          subject: 'Reminder: Activate Your Mercor Time Tracker Account',
          name: employee.name,
          html: `
            <h2>Reminder: Activate Your Account</h2>
            <p>Hello ${employee.name},</p>
            <p>This is a reminder to activate your Mercor Time Tracker account. Please click the link below:</p>
            <p><a href="${activationLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Activate Account</a></p>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p>${activationLink}</p>
            <p>Best regards,<br>The Mercor Team</p>
          `
        })
      })

      if (response.ok) {
        alert('Invitation email sent successfully!')
      } else {
        const errorData = await response.json()
        console.error('Email error:', errorData)
        alert(`Failed to send invitation email: ${errorData.error || 'Unknown error'}`)
      }
    } catch (emailError) {
      console.error('Failed to send email:', emailError)
      alert('Failed to send invitation email. Please try again.')
    }
    setResendingEmail(null)
  }

  if (authLoading || loading) {
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
            <h1 className="text-3xl font-bold">Employee Management</h1>
            <p className="text-muted-foreground">Manage your team members and their access</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard">
              <Button variant="outline">← Back to Dashboard</Button>
            </Link>
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
            <Button onClick={() => setShowAddForm(true)}>
              Add Employee
            </Button>
          </div>
        </div>

        {showAddForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New Employee</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddEmployee} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={newEmployee.name}
                      onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newEmployee.email}
                      onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={addingEmployee}>
                    {addingEmployee ? "Adding..." : "Add Employee"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {editingEmployee && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Edit Employee</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEditEmployee} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Name</Label>
                    <Input
                      id="edit-name"
                      value={editingEmployee.name}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editingEmployee.email}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Update Employee</Button>
                  <Button type="button" variant="outline" onClick={() => setEditingEmployee(null)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Employees ({employees.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {employees.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No employees found. Add your first employee to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${employee.status === 'active' ? 'bg-green-100 text-green-800' :
                          employee.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                          {employee.status}
                        </span>
                      </TableCell>
                      <TableCell>{new Date(employee.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingEmployee(employee)
                              setShowAddForm(false)
                            }}
                          >
                            Edit
                          </Button>
                          {employee.status === 'pending' && (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={(e) => handleResendInvitation(e, employee)}
                              disabled={resendingEmail === employee.id}
                            >
                              {resendingEmail === employee.id ? "Sending..." : "Resend"}
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteEmployee(employee.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}