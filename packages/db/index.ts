import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

// Database Types
export interface Employee {
  id: string
  email: string,
  name: string
  status: 'pending' | 'active' | 'inactive'
  activation_token?: string
  password?: string
  user_id?: string
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  name: string
  description?: string
  hourly_rate?: number
  status: 'active' | 'inactive' | 'completed'
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  name: string
  project_id: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface ProjectAssignment {
  id: string
  employee_id: string
  project_id: string
  created_at: string
}

export interface TaskAssignment {
  id: string
  employee_id: string
  task_id: string
  created_at: string
}

export interface TimeEntry {
  id: string
  employee_id: string
  project_id: string
  task_id: string
  started_at: string
  ended_at?: string
  duration?: number
  created_at: string
  updated_at: string
}

export interface Screenshot {
  id: string
  employee_id: string
  file_path: string
  time_entry_id?: string
  captured_at: string
  has_permission: boolean
}

export interface Device {
  id: string
  employee_id: string
  mac_address: string
  hostname: string
  last_seen: string
  created_at: string
}

export interface Admin {
  id: string
  email: string
  name: string
  created_at: string
  updated_at: string
}

// Database configuration
export const tables = {
  employees: 'employees',
  projects: 'projects',
  tasks: 'tasks',
  project_assignments: 'project_assignments',
  task_assignments: 'task_assignments',
  time_entries: 'time_entries',
  screenshots: 'screenshots',
  devices: 'devices',
  admins: 'admins'
} as const