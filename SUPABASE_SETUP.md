# Supabase Setup Guide

This guide explains how to set up Supabase for the Time Tracker application.

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - Name: `time-tracker` (or your preferred name)
   - Database Password: Generate a strong password
   - Region: Choose closest to your location
6. Click "Create new project"

## 2. Set Up Database Schema

1. Once your project is created, go to the **SQL Editor** in the Supabase dashboard
2. Copy the contents of `supabase/schema.sql` from this project
3. Paste it in the SQL Editor and click "RUN"
4. This will create all necessary tables, triggers, and policies

## 3. Configure Environment Variables

1. In your Supabase project dashboard, go to **Settings > API**
2. Copy the following values:
   - **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
   - **Project API Key - anon public** (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - **Project API Key - service_role** (SUPABASE_SERVICE_ROLE_KEY) - Optional

3. Create a `.env.local` file in the root of your project:

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL="your_project_url_here"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key_here"

# Optional (for admin operations)
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 4. Set Up Authentication

Supabase handles authentication automatically. The application supports:

- **Admin Login**: Email/password authentication for admin users
- **Employee Authentication**: Token-based activation system

### Admin Setup
1. Go to **Authentication > Users** in Supabase dashboard
2. Click "Add user" to create admin accounts
3. Use email/password authentication

### Employee Onboarding Flow
1. Admin creates employee record with activation token
2. Employee receives email with activation link
3. Employee sets password and gains access
4. Desktop app uses JWT tokens for API access

## 5. Configure Storage (for Screenshots)

1. Go to **Storage** in Supabase dashboard
2. The `screenshots` bucket is automatically created by the schema
3. Screenshots are stored securely with proper access policies

## 6. Row Level Security (RLS)

The schema automatically enables RLS with the following policies:
- **Admins**: Full access to all data
- **Employees**: Access only to their own data
- **Public**: No direct access

## 7. API Integration

The application uses Supabase's auto-generated REST API:

### Available Endpoints
- `/rest/v1/employees` - Employee management
- `/rest/v1/projects` - Project management  
- `/rest/v1/tasks` - Task management
- `/rest/v1/time_entries` - Time tracking
- `/rest/v1/screenshots` - Screenshot data

### Real-time Subscriptions
Supabase provides real-time capabilities for:
- Live time tracking updates
- Screenshot notifications
- Employee status changes

## 8. Database Schema Overview

```sql
employees (id, email, name, status, activation_token)
projects (id, name, description, hourly_rate, status)
tasks (id, name, project_id, is_default)
project_assignments (employee_id, project_id)
task_assignments (employee_id, task_id)
time_entries (id, employee_id, project_id, task_id, started_at, ended_at, duration)
screenshots (id, employee_id, file_path, time_entry_id, captured_at)
devices (id, employee_id, mac_address, hostname, last_seen)
admins (id, email, name)
```

## 9. Testing the Setup

1. Start the development server: `npm run dev`
2. Navigate to `http://localhost:3001`
3. Test authentication and database operations
4. Check Supabase dashboard for data changes

## Benefits of Using Supabase

- **Auto-generated APIs**: No need to write CRUD operations
- **Real-time subscriptions**: Live updates across applications
- **Built-in authentication**: Secure user management
- **Row Level Security**: Automatic data access control
- **File storage**: Screenshots and file uploads
- **Dashboard**: Easy database management
- **Scalability**: Handles growth automatically

## Next Steps

With Supabase configured, you can now:
1. Build the admin dashboard UI
2. Implement employee onboarding flow
3. Create the desktop Electron application
4. Add real-time features
5. Deploy to production