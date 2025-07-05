-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  activation_token TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  hourly_rate DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create project_assignments table
CREATE TABLE IF NOT EXISTS project_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(employee_id, project_id)
);

-- Create task_assignments table
CREATE TABLE IF NOT EXISTS task_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(employee_id, task_id)
);

-- Create time_entries table
CREATE TABLE IF NOT EXISTS time_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration INTEGER, -- in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create screenshots table
CREATE TABLE IF NOT EXISTS screenshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  time_entry_id UUID REFERENCES time_entries(id) ON DELETE SET NULL,
  captured_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  has_permission BOOLEAN DEFAULT true
);

-- Create devices table
CREATE TABLE IF NOT EXISTS devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  mac_address VARCHAR(255) NOT NULL,
  hostname VARCHAR(255) NOT NULL,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(employee_id, mac_address)
);

-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON time_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE screenshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admins (full access)
CREATE POLICY "Admins can view all employees" ON employees FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can insert employees" ON employees FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins can update employees" ON employees FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can delete employees" ON employees FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can view all projects" ON projects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can insert projects" ON projects FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins can update projects" ON projects FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can delete projects" ON projects FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can view all tasks" ON tasks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can insert tasks" ON tasks FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins can update tasks" ON tasks FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can delete tasks" ON tasks FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can view all assignments" ON project_assignments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can insert assignments" ON project_assignments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins can update assignments" ON project_assignments FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can delete assignments" ON project_assignments FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can view all task assignments" ON task_assignments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can insert task assignments" ON task_assignments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins can update task assignments" ON task_assignments FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can delete task assignments" ON task_assignments FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can view all time entries" ON time_entries FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can view all screenshots" ON screenshots FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can view all devices" ON devices FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can view all admins" ON admins FOR SELECT USING (auth.role() = 'authenticated');

-- Create storage bucket for screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('screenshots', 'screenshots', false);

-- Create storage policy for screenshots
CREATE POLICY "Authenticated users can upload screenshots" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'screenshots' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view screenshots" ON storage.objects FOR SELECT USING (bucket_id = 'screenshots' AND auth.role() = 'authenticated');