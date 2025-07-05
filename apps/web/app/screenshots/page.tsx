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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Screenshot Monitoring</h1>
            <p className="text-muted-foreground">
              Monitor employee productivity and activity
            </p>
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
