"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../../hooks/useAuth";
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
import { Employee, Task, Project } from "@time-tracker/db"; // Add Employee import
import Link from "next/link";
import { useParams } from "next/navigation";

export default function TasksPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [assigningTask, setAssigningTask] = useState<Task | null>(null);
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [newTask, setNewTask] = useState({
    name: "",
    project_id: projectId,
    is_default: false,
  });

  useEffect(() => {
    loadProject();
    loadTasks();
    loadEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const loadProject = async () => {
    const { data, error } = await database.getProjects();
    if (data) {
      const foundProject = data.find((p: Project) => p.id === projectId);
      setProject(foundProject || null);
    }
  };

  const loadTasks = async () => {
    try {
      const { data, error } = await database.getTasks(projectId);
      if (data) {
        setTasks(data);
      }
      if (error) {
        console.error("Error loading tasks:", error);
      }
    } catch (err) {
      console.error("Failed to load tasks:", err);
    }
    setLoading(false);
  };

  const loadEmployees = async () => {
    const { data, error } = await database.getProjectAssignments(projectId);
    if (data) {
      // Get the employees assigned to this project
      const employeeIds = data.map((assignment: { employee_id: string }) => assignment.employee_id);
      const { data: allEmployees } = await database.getEmployees();
      if (allEmployees) {
        setAvailableEmployees(
          allEmployees.filter(
            (emp: Employee) => employeeIds.includes(emp.id) && emp.status === "active"
          )
        );
      }
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await database.createTask({
      ...newTask,
      project_id: projectId,
    });

    if (data) {
      setTasks([...tasks, data[0]]);
      setNewTask({
        name: "",
        project_id: projectId,
        is_default: false,
      });
      setShowAddForm(false);
    }
  };

  const handleEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    const { data, error } = await database.updateTask(editingTask.id, {
      name: editingTask.name,
      is_default: editingTask.is_default,
    });

    if (data) {
      setTasks(tasks.map((t) => (t.id === editingTask.id ? data[0] : t)));
      setEditingTask(null);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      const { error } = await database.deleteTask(id);
      if (!error) {
        setTasks(tasks.filter((task) => task.id !== id));
      }
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { data, error } = await database.updateTask(id, {
      status: newStatus,
    });
    if (data) {
      setTasks(
        tasks.map((task) =>
          task.id === id ? { ...task, status: newStatus as any } : task
        )
      );
    }
  };

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningTask || !selectedEmployee) return;

    const { data, error } = await database.assignTaskToEmployee(
      assigningTask.id,
      selectedEmployee
    );

    if (!error) {
      setTasks(
        tasks.map((task) =>
          task.id === assigningTask.id
            ? { ...task, assigned_to: selectedEmployee }
            : task
        )
      );
      setAssigningTask(null);
      setSelectedEmployee("");
      alert("Task assigned successfully!");
    } else {
      alert("Failed to assign task. Please try again.");
    }
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
            <h1 className="text-3xl font-bold">Task Management</h1>
            <p className="text-muted-foreground">
              {project
                ? `Manage tasks for ${project.name}`
                : "Manage project tasks"}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/projects">
              <Button variant="outline">← Back to Projects</Button>
            </Link>
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
            <Button onClick={() => setShowAddForm(true)}>Add Task</Button>
          </div>
        </div>

        {showAddForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New Task</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddTask} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Task Title</Label>
                    <Input
                      id="title"
                      value={newTask.name}
                      onChange={(e) =>
                        setNewTask({ ...newTask, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estimated_hours">Estimated Hours</Label>
                    <Input
                      id="estimated_hours"
                      type="number"
                      step="0.5"
                      value={newTask.estimated_hours || ""}
                      onChange={(e) =>
                        setNewTask({
                          ...newTask,
                          estimated_hours: e.target.value
                            ? parseFloat(e.target.value)
                            : 0,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    value={newTask.priority}
                    onChange={(e) =>
                      setNewTask({
                        ...newTask,
                        priority: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                    rows={3}
                    value={newTask.description}
                    onChange={(e) =>
                      setNewTask({ ...newTask, description: e.target.value })
                    }
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Add Task</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {editingTask && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Edit Task</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEditTask} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-title">Task Title</Label>
                    <Input
                      id="edit-title"
                      value={editingTask.title}
                      onChange={(e) =>
                        setEditingTask({
                          ...editingTask,
                          title: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-estimated_hours">
                      Estimated Hours
                    </Label>
                    <Input
                      id="edit-estimated_hours"
                      type="number"
                      step="0.5"
                      value={editingTask.estimated_hours || ""}
                      onChange={(e) =>
                        setEditingTask({
                          ...editingTask,
                          estimated_hours: e.target.value
                            ? parseFloat(e.target.value)
                            : 0,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-priority">Priority</Label>
                  <select
                    id="edit-priority"
                    value={editingTask.priority}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        priority: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <textarea
                    id="edit-description"
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                    rows={3}
                    value={editingTask.description || ""}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Update Task</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingTask(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {assigningTask && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Assign Task: {assigningTask.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAssignTask} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="employee">Select Employee</Label>
                  <select
                    id="employee"
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                    required
                  >
                    <option value="">Choose an employee</option>
                    {availableEmployees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} ({employee.email})
                      </option>
                    ))}
                  </select>
                  {availableEmployees.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No employees assigned to this project
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={!selectedEmployee}>
                    Assign Task
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setAssigningTask(null);
                      setSelectedEmployee("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Tasks ({tasks.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No tasks found. Add your first task to get started.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Estimated Hours</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">
                        {task.title}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {task.description || "No description"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${task.priority === "high"
                              ? "bg-red-100 text-red-800"
                              : task.priority === "medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                        >
                          {task.priority}
                        </span>
                      </TableCell>
                      <TableCell>
                        <select
                          value={task.status}
                          onChange={(e) =>
                            handleStatusChange(task.id, e.target.value)
                          }
                          className="px-2 py-1 rounded text-xs border"
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </TableCell>
                      <TableCell>
                        {task.estimated_hours
                          ? `${task.estimated_hours}h`
                          : "Not set"}
                      </TableCell>
                      <TableCell>
                        {task.assigned_to ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {availableEmployees.find(
                              (emp) => emp.id === task.assigned_to
                            )?.name || "Unknown"}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            Unassigned
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(task.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingTask(task);
                              setShowAddForm(false);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setAssigningTask(task);
                              setEditingTask(null);
                              setShowAddForm(false);
                              setSelectedEmployee(task.assigned_to || "");
                            }}
                          >
                            Assign
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteTask(task.id)}
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
  );
}
