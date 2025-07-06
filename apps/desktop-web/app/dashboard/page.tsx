"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@time-tracker/ui";
import { Button } from "@time-tracker/ui";
import { database } from "@time-tracker/api";
import { Employee, Project, Task, TimeEntry } from "@time-tracker/db";
import Cookies from "js-cookie";
import {
  Clock,
  Play,
  Square,
  Calendar,
  Target,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";

export default function DashboardPage() {
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTimeEntry, setActiveTimeEntry] = useState<TimeEntry | null>(
    null
  );
  const [todayEntries, setTodayEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState<number>(0);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedTask, setSelectedTask] = useState<string>("");

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (employee) {
      loadDashboardData();
    }
  }, [employee]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTimeEntry) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTimeEntry]);

  const checkAuth = () => {
    const employeeCookie = Cookies.get("employee-data");

    if (!employeeCookie) {
      router.push("/login");
      return;
    }

    try {
      const employeeData = JSON.parse(employeeCookie);
      setEmployee(employeeData);
    } catch (error) {
      console.error("Error parsing employee cookie:", error);
      router.push("/login");
    }
  };

  const loadDashboardData = async () => {
    if (!employee) return;

    try {
      console.log("Loading dashboard data for employee:", employee.id);

      // First, test if database object is properly imported
      console.log("Database object:", database);
      console.log("Available database methods:", Object.keys(database));

      // Test basic connection with getProjects first
      console.log("Testing getProjects first...");
      const { data: testData, error: testError } = await database.getProjects();
      console.log("getProjects test result:", { testData, testError, hasData: !!testData, dataLength: testData?.length });

      // Load employee's projects
      console.log("Now testing getEmployeeProjects with employee ID:", employee.id);
      const { data: projectsData, error: projectsError } = await database.getEmployeeProjects(
        employee.id
      );
      
      console.log("Projects response:", { 
        projectsData, 
        projectsError,
        dataType: typeof projectsData,
        isArray: Array.isArray(projectsData),
        dataLength: projectsData?.length 
      });

      if (projectsData && Array.isArray(projectsData) && projectsData.length > 0) {
        const validProjects: Project[] = [];
        for (const p of projectsData) {
          if (p && typeof p === 'object' && 'id' in p && 'name' in p) {
            validProjects.push(p as unknown as Project);
          }
        }
        setProjects(validProjects);
        if (validProjects.length > 0 && validProjects[0]) {
          setSelectedProject(validProjects[0].id);
        }
      } else {
        console.log("No projects found for employee");
        setProjects([]);
      }

      // Load employee's tasks
      const { data: tasksData, error: tasksError } = await database.getEmployeeTasks(employee.id);
      
      console.log("Tasks response:", { tasksData, tasksError });

      if (tasksData && Array.isArray(tasksData) && tasksData.length > 0) {
        const validTasks: Task[] = [];
        for (const t of tasksData) {
          if (t && typeof t === 'object' && 'id' in t && 'name' in t) {
            validTasks.push(t as unknown as Task);
          }
        }
        setTasks(validTasks);
        if (validTasks.length > 0 && validTasks[0]) {
          setSelectedTask(validTasks[0].id);
        }
      } else {
        console.log("No tasks found for employee");
        setTasks([]);
      }

      // Load active time entry
      const { data: activeEntry, error: activeError } = await database.getActiveTimeEntry(
        employee.id
      );
      
      console.log("Active entry response:", { activeEntry, activeError });

      if (activeEntry) {
        setActiveTimeEntry(activeEntry);
        const startTime = new Date(activeEntry.started_at).getTime();
        const now = new Date().getTime();
        setTimer(Math.floor((now - startTime) / 1000));
      } else {
        setActiveTimeEntry(null);
        setTimer(0);
      }

      // Load today's entries
      const { data: todayData, error: todayError } = await database.getTodayTimeEntries(
        employee.id
      );
      
      console.log("Today entries response:", { todayData, todayError });

      if (todayData) {
        setTodayEntries(todayData);
      } else {
        setTodayEntries([]);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTimer = async () => {
    if (!employee || !selectedProject || !selectedTask) return;

    try {
      const { data, error } = await database.startTimeEntry(
        employee.id,
        selectedProject,
        selectedTask
      );
      if (data && !error) {
        setActiveTimeEntry(data);
        setTimer(0);
        await loadDashboardData(); // Refresh today's entries
      } else {
        console.error("Error starting timer:", error);
      }
    } catch (error) {
      console.error("Error starting timer:", error);
    }
  };

  const handleStopTimer = async () => {
    if (!employee) return;

    try {
      const { data, error } = await database.stopTimeEntry(employee.id);
      if (data && !error) {
        setActiveTimeEntry(null);
        setTimer(0);
        await loadDashboardData(); // Refresh today's entries
      } else {
        console.error("Error stopping timer:", error);
      }
    } catch (error) {
      console.error("Error stopping timer:", error);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const calculateTodayTotal = () => {
    return todayEntries.reduce((total, entry) => {
      if (entry.duration) {
        return total + entry.duration;
      }
      return total;
    }, 0);
  };

  const handleLogout = () => {
    Cookies.remove("employee-data");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Time Tracker</h1>
              {employee && (
                <span className="text-sm text-gray-600">
                  Welcome, {employee.name}
                </span>
              )}
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Active Timer Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Active Timer</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeTimeEntry ? (
              <div className="text-center">
                <div className="text-4xl font-mono font-bold text-blue-600 mb-4">
                  {formatDuration(timer)}
                </div>
                <div className="text-sm text-gray-600 mb-4">
                  Started at{" "}
                  {format(new Date(activeTimeEntry.started_at), "HH:mm")}
                </div>
                <Button
                  onClick={handleStopTimer}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop Timer
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-4xl font-mono font-bold text-gray-400 mb-4">
                  00:00:00
                </div>
                <div className="text-sm text-gray-600 mb-4">
                  No active timer
                </div>
                <div className="space-y-4">
                  <div className="flex space-x-4 justify-center">
                    <select
                      value={selectedProject}
                      onChange={(e) => setSelectedProject(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={selectedTask}
                      onChange={(e) => setSelectedTask(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {tasks.map((task) => (
                        <option key={task.id} value={task.id}>
                          {task.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    onClick={handleStartTimer}
                    disabled={!selectedProject || !selectedTask}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Timer
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Today's Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Today's Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {formatDuration(calculateTodayTotal())}
                </div>
                <p className="text-sm text-gray-600">Total hours today</p>
                <div className="mt-4 text-left">
                  <p className="text-sm text-gray-600">
                    Entries: {todayEntries.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assigned Projects */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>My Projects</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {projects.length > 0 ? (
                  projects.map((project) => (
                    <div
                      key={project.id}
                      className="p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500"
                    >
                      <h3 className="font-medium text-gray-900">
                        {project.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {project.description}
                      </p>
                      {project.hourly_rate && (
                        <p className="text-xs text-gray-500 mt-1">
                          ${project.hourly_rate}/hr
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No projects assigned
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Assigned Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>My Tasks</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tasks.length > 0 ? (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 bg-gray-50 rounded-lg border-l-4 border-green-500"
                    >
                      <h3 className="font-medium text-gray-900">{task.name}</h3>
                      {task.is_default && (
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-1">
                          Default
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No tasks assigned
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Time Entries */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Today's Time Entries</CardTitle>
          </CardHeader>
          <CardContent>
            {todayEntries.length > 0 ? (
              <div className="space-y-3">
                {todayEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {entry.project?.name} - {entry.task?.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(entry.started_at), "HH:mm")} -
                        {entry.ended_at
                          ? format(new Date(entry.ended_at), " HH:mm")
                          : " Active"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {entry.duration
                          ? formatDuration(entry.duration)
                          : "00:00:00"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No time entries for today
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
