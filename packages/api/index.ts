import { supabase } from '@time-tracker/db'
import crypto from 'crypto'

export const auth = {
  generateActivationToken: (): string => {
    return crypto.randomBytes(32).toString('hex')
  },

  // Supabase handles authentication, but we can add helper methods
  getCurrentUser: async () => {
    if (!supabase) return null
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  signInWithEmail: async (email: string, password: string) => {
    if (!supabase) return { data: null, error: { message: 'Supabase not configured' } }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  signUp: async (email: string, password: string, metadata?: any) => {
    if (!supabase) return { data: null, error: { message: 'Supabase not configured' } }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
    return { data, error }
  },

  signOut: async () => {
    if (!supabase) return { error: { message: 'Supabase not configured' } }
    const { error } = await supabase.auth.signOut()
    return { error }
  }
}

export const response = {
  success: (data: any, message?: string) => {
    return {
      success: true,
      data,
      message
    }
  },

  error: (message: string, statusCode: number = 400) => {
    return {
      success: false,
      message,
      statusCode
    }
  }
}

export const utils = {
  calculateDuration: (startTime: Date, endTime: Date): number => {
    return Math.floor((endTime.getTime() - startTime.getTime()) / 1000)
  },

  formatDuration: (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  },

  generateEmployeeId: (): string => {
    return `EMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

// Database helper functions
export const database = {
  // Employees
  async getEmployees() {
    if (!supabase) return { data: [], error: { message: 'Supabase not configured' } }
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false })
    return { data, error }
  },

  async createEmployee(employee: { email: string; name: string; activation_token?: string }) {
    if (!supabase) return { data: null, error: { message: 'Supabase not configured' } }
    const { data, error } = await supabase
      .from('employees')
      .insert([employee])
      .select()
    return { data, error }
  },

  async updateEmployee(id: string, updates: any) {
    if (!supabase) return { data: null, error: { message: 'Supabase not configured' } }
    const { data, error } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', id)
      .select()
    return { data, error }
  },

  async deleteEmployee(id: string) {
    if (!supabase) return { data: null, error: { message: 'Supabase not configured' } }
    const { data, error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id)
    return { data, error }
  },

  // Projects
  async getProjects() {
    if (!supabase) return { data: [], error: { message: 'Supabase not configured' } }
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
    return { data, error }
  },

  async createProject(project: { name: string; description?: string; hourly_rate?: number }) {
    if (!supabase) return { data: null, error: { message: 'Supabase not configured' } }
    const { data, error } = await supabase
      .from('projects')
      .insert([project])
      .select()
    return { data, error }
  },

  async updateProject(id: string, updates: any) {
    if (!supabase) return { data: null, error: { message: 'Supabase not configured' } }
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
    return { data, error }
  },

  async deleteProject(id: string) {
    if (!supabase) return { data: null, error: { message: 'Supabase not configured' } }
    const { data, error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
    return { data, error }
  },

  // Tasks
  async getTasks(projectId?: string) {
    if (!supabase) return { data: [], error: { message: 'Supabase not configured' } }
    let query = supabase
      .from('tasks')
      .select('*, projects(*)')
      .order('created_at', { ascending: false })
    
    if (projectId) {
      query = query.eq('project_id', projectId)
    }
    
    const { data, error } = await query
    return { data, error }
  },

  async createTask(task: { name: string; project_id: string; is_default?: boolean }) {
    if (!supabase) return { data: null, error: { message: 'Supabase not configured' } }
    const { data, error } = await supabase
      .from('tasks')
      .insert([task])
      .select()
    return { data, error }
  },

  async updateTask(id: string, updates: any) {
    if (!supabase) return { data: null, error: { message: 'Supabase not configured' } }
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
    return { data, error }
  },

  async deleteTask(id: string) {
    if (!supabase) return { data: null, error: { message: 'Supabase not configured' } }
    const { data, error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
    return { data, error }
  },

  // Time Entries
  async getTimeEntries(employeeId?: string) {
    if (!supabase) return { data: [], error: { message: 'Supabase not configured' } }
    let query = supabase
      .from('time_entries')
      .select('*, employees(*), projects(*), tasks(*)')
      .order('started_at', { ascending: false })
    
    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    }
    
    const { data, error } = await query
    return { data, error }
  },

  async createTimeEntry(timeEntry: { employee_id: string; project_id: string; task_id: string; started_at: string }) {
    if (!supabase) return { data: null, error: { message: 'Supabase not configured' } }
    const { data, error } = await supabase
      .from('time_entries')
      .insert([timeEntry])
      .select()
    return { data, error }
  },

  async updateTimeEntry(id: string, updates: any) {
    if (!supabase) return { data: null, error: { message: 'Supabase not configured' } }
    const { data, error } = await supabase
      .from('time_entries')
      .update(updates)
      .eq('id', id)
      .select()
    return { data, error }
  },

  // Screenshots
  async getScreenshots(employeeId?: string) {
    if (!supabase) return { data: [], error: { message: 'Supabase not configured' } }
    let query = supabase
      .from('screenshots')
      .select('*, employees(*), time_entries(*)')
      .order('captured_at', { ascending: false })
    
    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    }
    
    const { data, error } = await query
    return { data, error }
  },

  async createScreenshot(screenshot: { employee_id: string; file_path: string; time_entry_id?: string; has_permission?: boolean }) {
    if (!supabase) return { data: null, error: { message: 'Supabase not configured' } }
    const { data, error } = await supabase
      .from('screenshots')
      .insert([screenshot])
      .select()
    return { data, error }
  },

  // Project Assignments
  async assignEmployeesToProject(projectId: string, employeeIds: string[]) {
    if (!supabase) return { data: null, error: { message: 'Supabase not configured' } }
    
    // First remove existing assignments
    await supabase
      .from('project_assignments')
      .delete()
      .eq('project_id', projectId)
    
    // Then add new assignments
    const assignments = employeeIds.map(employeeId => ({
      project_id: projectId,
      employee_id: employeeId
    }))
    
    const { data, error } = await supabase
      .from('project_assignments')
      .insert(assignments)
      .select()
    return { data, error }
  },

  async getProjectAssignments(projectId: string) {
    if (!supabase) return { data: [], error: { message: 'Supabase not configured' } }
    const { data, error } = await supabase
      .from('project_assignments')
      .select('*, employees(*)')
      .eq('project_id', projectId)
    return { data, error }
  },

  // Task Assignments
  async assignEmployeesToTask(taskId: string, employeeIds: string[]) {
    if (!supabase) return { data: null, error: { message: 'Supabase not configured' } }
    
    // First remove existing assignments
    await supabase
      .from('task_assignments')
      .delete()
      .eq('task_id', taskId)
    
    // Then add new assignments
    const assignments = employeeIds.map(employeeId => ({
      task_id: taskId,
      employee_id: employeeId
    }))
    
    const { data, error } = await supabase
      .from('task_assignments')
      .insert(assignments)
      .select()
    return { data, error }
  },

  async getTaskAssignments(taskId: string) {
    if (!supabase) return { data: [], error: { message: 'Supabase not configured' } }
    const { data, error } = await supabase
      .from('task_assignments')
      .select('*, employees(*)')
      .eq('task_id', taskId)
    return { data, error }
  },

  async getProjectEmployees(projectId: string) {
    if (!supabase) return { data: [], error: { message: 'Supabase not configured' } }
    const { data, error } = await supabase
      .from('project_assignments')
      .select('employee_id, employees(*)')
      .eq('project_id', projectId)
    return { data, error }
  }
}