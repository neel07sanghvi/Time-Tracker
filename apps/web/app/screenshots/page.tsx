"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "@time-tracker/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@time-tracker/ui";
import { Input } from "@time-tracker/ui";
import { Label } from "@time-tracker/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@time-tracker/ui";
import { database } from "@time-tracker/api";
import { Screenshot } from "@time-tracker/db";
import Link from "next/link";
import {
  Camera,
  ArrowLeft,
  LogOut,
  Filter,
  Eye,
  Calendar,
  Users,
  Activity,
  BarChart3,
  Clock,
  CheckCircle,
  Image,
  Monitor,
  User,
} from "lucide-react";

export default function ScreenshotsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    loadScreenshots();
    loadEmployees();
  }, []);

  useEffect(() => {
    loadScreenshots();
  }, [selectedEmployee, dateFilter]); // Removed selectedProject since it's not supported by API

  const loadScreenshots = async () => {
    try {
      const { data, error } = await database.getScreenshots(selectedEmployee);

      if (data) {
        // Apply client-side filtering for project and date since the API doesn't support these filters yet
        let filteredData = data;

        if (dateFilter) {
          filteredData = filteredData.filter((screenshot) => {
            const capturedDate = new Date(screenshot.captured_at).toISOString().split('T')[0];
            return capturedDate === dateFilter;
          });
        }

        setScreenshots(filteredData);
      }
      if (error) {
        console.error("Error loading screenshots:", error);
      }
    } catch (err) {
      console.error("Failed to load screenshots:", err);
    }
    setLoading(false);
  };

  const loadEmployees = async () => {
    const { data, error } = await database.getEmployees();
    if (data) {
      setEmployees(data.filter((emp) => emp.status === "active"));
    }
  };

  const clearFilters = () => {
    setSelectedEmployee("");
    setDateFilter("");
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find((emp) => emp.id === employeeId);
    return employee ? employee.name : "Unknown Employee";
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading screenshots...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const totalScreenshots = screenshots.length;
  const screenshotsWithTimeEntry = screenshots.filter((s) => s.time_entry_id).length;
  const screenshotsWithPermission = screenshots.filter((s) => s.has_permission).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <Camera className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Screenshot Monitoring
                </h1>
                <p className="text-sm text-gray-600">
                  Monitor productivity • {totalScreenshots} screenshots captured
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/dashboard">
                <Button variant="outline" className="hover:bg-blue-50 hover:border-blue-200">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Button variant="outline" onClick={logout} className="hover:bg-red-50 hover:border-red-200">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 bg-white/70 backdrop-blur-sm hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Screenshots</p>
                  <div className="text-3xl font-bold text-gray-900">{totalScreenshots}</div>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Camera className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/70 backdrop-blur-sm hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">With Time Entry</p>
                  <div className="text-3xl font-bold text-green-600">{screenshotsWithTimeEntry}</div>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/70 backdrop-blur-sm hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">With Permission</p>
                  <div className="text-3xl font-bold text-purple-600">{screenshotsWithPermission}</div>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employee">Employee</Label>
                <select
                  id="employee"
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="">All Employees</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>
              <div className="space-y-2 flex items-end">
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Screenshots ({screenshots.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {screenshots.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No screenshots found for the selected filters.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Time Entry</TableHead>
                      <TableHead>Captured At</TableHead>
                      <TableHead>Permission</TableHead>
                      <TableHead>Screenshot</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {screenshots.map((screenshot) => (
                      <TableRow key={screenshot.id}>
                        <TableCell className="font-medium">
                          {getEmployeeName(screenshot.employee_id)}
                        </TableCell>
                        <TableCell>
                          {screenshot.time_entry_id
                            ? "Project Activity"
                            : "No Project"}
                        </TableCell>
                        <TableCell>
                          {screenshot.time_entry_id
                            ? "Task Activity"
                            : "General Activity"}
                        </TableCell>
                        <TableCell>
                          {new Date(screenshot.captured_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="h-2 rounded-full bg-blue-500"
                                style={{
                                  width: "100%",
                                }}
                              />
                            </div>
                            <span className="text-sm">
                              Active
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {screenshot.file_path ? (
                            <div className="space-y-2">
                              <img
                                src={screenshot.file_path}
                                alt="Screenshot"
                                className="w-24 h-16 object-cover rounded border cursor-pointer hover:opacity-80"
                                onClick={() =>
                                  window.open(screenshot.file_path, "_blank")
                                }
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  window.open(screenshot.file_path, "_blank")
                                }
                              >
                                View Full
                              </Button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              No image
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Screenshot Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {screenshots.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Screenshots
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {screenshots.filter((s) => s.time_entry_id).length}
                </div>
                <div className="text-sm text-muted-foreground">
                  With Time Entry
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {screenshots.filter((s) => s.has_permission).length}
                </div>
                <div className="text-sm text-muted-foreground">
                  With Permission
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
