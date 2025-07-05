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
import { Employee, Task, Project, TaskAssignment } from "@time-tracker/db";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function TasksPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskAssignments, setTaskAssignments] = useState<{ [taskId: string]: Employee }>({});
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
    loadTaskAssignments();
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

  const loadTaskAssignments = async () => {
    const { data, error } = await database.getProjectTaskAssignments(projectId);
    if (data) {
      const assignments: { [taskId: string]: Employee } = {};
      data.forEach((assignment: any) => {
        if (assignment.employees) {
          assignments[assignment.task_id] = assignment.employees;
        }
      });
      setTaskAssignments(assignments);
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

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningTask || !selectedEmployee) return;

    const { data, error } = await database.assignTaskToEmployee(
      assigningTask.id,
      selectedEmployee
    );

    if (!error) {
      // Reload task assignments to update the table
      await loadTaskAssignments();
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
                <div className="space-y-2">
                  <Label htmlFor="name">Task Name</Label>
                  <Input
                    id="name"
                    value={newTask.name}
                    onChange={(e) =>
                      setNewTask({ ...newTask, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_default"
                    checked={newTask.is_default}
                    onChange={(e) =>
                      setNewTask({ ...newTask, is_default: e.target.checked })
                    }
                    className="rounded border-input"
                  />
                  <Label htmlFor="is_default">Set as default task</Label>
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
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Task Name</Label>
                  <Input
                    id="edit-name"
                    value={editingTask.name}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        name: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-is_default"
                    checked={editingTask.is_default || false}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        is_default: e.target.checked,
                      })
                    }
                    className="rounded border-input"
                  />
                  <Label htmlFor="edit-is_default">Set as default task</Label>
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
              <CardTitle>Assign Task: {assigningTask.name}</CardTitle>
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
                    <TableHead>Name</TableHead>
                    <TableHead>Default Task</TableHead>
                    <TableHead>Assigned Employee</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">
                        {task.name}
                      </TableCell>
                      <TableCell>
                        {task.is_default ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            Default
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            No
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {taskAssignments[task.id] ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {taskAssignments[task.id]?.name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            Not assigned
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
                              // Set the currently assigned employee as default
                              setSelectedEmployee(taskAssignments[task.id]?.id || "");
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
