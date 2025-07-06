# Time Tracker Application

A comprehensive employee time tracking system with screenshot monitoring, built with modern web technologies and a desktop application for seamless employee experience.

## 🚀 Overview

This Time Tracker application provides:

- **Admin Web Dashboard** - Manage employees, projects, tasks, and view time reports
- **Employee Desktop Application** - Time tracking with automatic screenshot capture
- **Employee Web Interface** - Browser-based time tracking alternative
- **Real-time Updates** - Live synchronization across all applications
- **Screenshot Monitoring** - Automatic screenshot capture during work sessions
- **JWT Authentication** - Secure token-based authentication system

## 🏗️ Architecture

This is a **Turborepo** monorepo containing multiple applications and shared packages:

```
time-tracker/
├── apps/
│   ├── web/                 # Admin web dashboard (Next.js) - Port 3000
│   ├── desktop-web/         # Employee web interface (Next.js) - Port 3001
│   └── desktop/             # Electron desktop app
├── packages/
│   ├── ui/                  # Shared React components
│   ├── api/                 # API utilities and clients
│   ├── db/                  # Database utilities
│   ├── validation/          # Zod validation schemas
│   ├── eslint-config/       # ESLint configurations
│   └── typescript-config/   # TypeScript configurations
└── supabase/               # Database schema and setup
```

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Real-time + Auth + Storage)
- **Desktop**: Electron.js
- **Build System**: Turborepo
- **Authentication**: Supabase Auth with JWT tokens
- **File Storage**: Supabase Storage (for screenshots)
- **Styling**: Tailwind CSS with custom UI components
- **Forms**: React Hook Form with Zod validation

## 📋 Prerequisites

- **Node.js** 18+
- **npm** 10.2.4+
- **Supabase Account** (for database and authentication)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Time-Tracker
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. **Create a Supabase Project**:
   - Go to [https://supabase.com](https://supabase.com)
   - Create a new project
   - Note your Project URL and API Keys

2. **Set Up Database Schema**:
   - Go to your Supabase project's SQL Editor
   - Copy and execute the contents of `supabase/schema.sql`
   - This creates all necessary tables, triggers, and policies

3. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory:

   ```bash
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL="your_supabase_project_url"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
   SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"

   # App Configuration
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

   For detailed Supabase setup instructions, see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md).

### 4. Start Development Servers

```bash
# Start all applications
npm run build

# Or start individual applications:

# Admin Web Dashboard (port 3000)
npm run dev:web

# Employee Web Interface (port 3001)
npm run dev:desktop
```

### 5. Access Applications

- **Admin Dashboard**: [http://localhost:3000](http://localhost:3000)
- **Employee Interface**: [http://localhost:3001](http://localhost:3001)

## 📁 Project Structure

### Applications

#### `/apps/web` - Admin Web Dashboard

- **Purpose**: Administrative interface for managing the time tracking system
- **Port**: 3000
- **Features**:
  - Employee management and onboarding
  - Project and task creation
  - Time reports and analytics
  - Screenshot monitoring dashboard
  - Employee activation system

#### `/apps/desktop-web` - Employee Web Interface

- **Purpose**: Browser-based time tracking for employees
- **Port**: 3001
- **Features**:
  - Time tracking with start/stop functionality
  - Project and task selection
  - Real-time timer display
  - Screenshot capture integration

#### `/apps/desktop` - Electron Desktop Application

- **Purpose**: Native desktop application for employees
- **Features**:
  - Background time tracking
  - Automatic screenshot capture
  - System tray integration
  - Offline capability with sync

### Packages

#### `/packages/ui`

Shared React components using Tailwind CSS:

- Button, Card, Input, Label components
- Table components for data display
- Consistent styling across applications

#### `/packages/api`

API utilities and Supabase client configurations:

- Supabase client setup
- API endpoint definitions
- Authentication helpers

#### `/packages/db`

Database utilities and type definitions:

- TypeScript types for database entities
- Database query helpers
- Schema type inference

#### `/packages/validation`

Zod validation schemas:

- Form validation schemas
- API request/response validation
- Type-safe data validation

## 🎯 Key Features

### For Administrators

- **Employee Management**: Create, activate, and manage employee accounts
- **Project Management**: Create projects with hourly rates and assign employees
- **Task Management**: Define tasks within projects for detailed tracking
- **Time Reports**: View detailed time reports with filtering options
- **Screenshot Monitoring**: Monitor employee activity through screenshots
- **Real-time Dashboard**: Live updates of employee activity

### For Employees

- **Time Tracking**: Easy start/stop time tracking with project/task selection
- **Desktop Application**: Native app with system tray integration
- **Screenshot Capture**: Automatic screenshot capture during work sessions
- **Web Interface**: Browser-based alternative to desktop app
- **Real-time Sync**: Changes sync across all devices instantly

## 🔐 Authentication Flow

### Admin Authentication

1. Email/password login through Supabase Auth
2. Admin records stored in `admins` table
3. JWT tokens for API access

### Employee Authentication

1. **Activation**: Admin creates employee with activation token
2. **Email Invitation**: Employee receives activation email
3. **Password Setup**: Employee sets password using activation token
4. **Login**: JWT-based authentication for desktop/web apps

## 📊 Database Schema

The application uses PostgreSQL through Supabase with the following main entities:

- **employees** - Employee profiles and authentication
- **projects** - Project definitions with hourly rates
- **tasks** - Tasks within projects
- **time_entries** - Time tracking records
- **screenshots** - Screenshot metadata and storage paths
- **devices** - Employee device registration
- **admins** - Administrator accounts
- **project_assignments** - Employee-project relationships
- **task_assignments** - Employee-task relationships

## 🔧 Development Scripts

```bash
# Install dependencies
npm install

# Development
npm run dev:web          # Start admin dashboard
npm run dev:desktop      # Start employee interface

# Build
npm run build           # Build all applications
npm run lint            # Lint all packages
npm run format          # Format code with Prettier
npm run check-types     # TypeScript type checking
npm run build:win       # Build for Windows
npm run build:mac       # Build for macOS
npm run build:linux     # Build for Linux
```

## 🚀 Deployment

### Web Applications

- Deploy Next.js applications to Vercel, Netlify, or any Node.js hosting
- Ensure environment variables are configured in production
- Update CORS settings in Supabase for production domains

### Desktop Application

- Build Electron app for Windows, macOS, and Linux
- Use electron-builder for packaging and distribution
- Code signing certificates recommended for production

### Database

- Supabase handles scaling automatically
- Configure production RLS policies for security
- Set up database backups and monitoring

## 🔒 Security Considerations

- **Row Level Security (RLS)**: Implemented in Supabase for data isolation
- **JWT Tokens**: Secure authentication with automatic expiration
- **API Key Protection**: Environment variables for sensitive credentials
- **Screenshot Privacy**: Secure storage with access controls
- **HTTPS**: Required for production deployments

## 🐛 Troubleshooting

### Common Issues

1. **Supabase Connection Issues**:
   - Verify environment variables are correct
   - Check Supabase project status
   - Ensure database schema is properly set up

2. **Build Errors**:
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Clear Turbo cache: `npx turbo clean`

3. **Port Conflicts**:
   - Admin dashboard uses port 3000
   - Employee interface uses port 3001
   - Change ports in package.json if needed

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make changes and test thoroughly
4. Commit with descriptive messages
5. Push to your fork and create a Pull Request

## 📝 License

This project is proprietary software. All rights reserved.

## 📞 Support

For setup assistance or bug reports, please create an issue in the repository or contact the development team.

---

**Happy Time Tracking! ⏰**
