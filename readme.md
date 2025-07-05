# Time Tracker: Insightful Clone

This document outlines the complete architecture and tech stack required to build a full-featured time tracking system inspired by Insightful. The goal is to enable time logging, screenshot capture, and project management for remote employees.

---

## 📦 Monorepo Setup

Use **Turborepo** to organize the codebase into a scalable monorepo:

```
time-tracker/
├── apps/
│   ├── web/                  # Next.js App (Admin + Employee Web Portal)
│   └── desktop/              # Electron App (Employee Timer + Screenshot)
├── packages/
│   ├── api/                  # Shared API utilities
│   ├── db/                   # Prisma schema and Supabase types
│   ├── ui/                   # Shared components using shadcn/ui
│   └── validation/           # Zod schemas for validation
├── supabase/                 # SQL schema, migrations
├── turbo.json
├── .env
└── README.md
```

---

## ⚙️ Technologies and Usage

### 1. **Next.js** (`apps/web`)
- Use **App Router**
- Hosts admin dashboard and employee onboarding
- Handles:
  - Employee activation via email
  - Project and employee management (CRUD)
  - Screenshots and time reports for admin

### 2. **NextAuth.js**
- Use for admin login via email/password
- Session-based auth for web
- JWT tokens for API and desktop app access

### 3. **Prisma ORM** (`packages/db`)
- ORM over Supabase PostgreSQL
- Declare all tables: employees, projects, tasks, time entries, screenshots
- Easily infer types and generate migrations

### 4. **Zod** (`packages/validation`)
- Input validation on:
  - API endpoints
  - Frontend forms
- Shared between web and desktop for consistency
- Strongly typed using `z.infer<>`

### 5. **Supabase**
- PostgreSQL DB and object storage
- Stores:
  - Users, Projects, Tasks, Screenshots, Time Entries
- Host screenshots in Supabase Storage

### 6. **Electron** (`apps/desktop`)
- Desktop app for employees
- Captures:
  - Timer sessions (start/stop)
  - Screenshots every 10 minutes
  - Device info (MAC, IP, hostname)
- Tray menu support for background mode

### 7. **TypeScript**
- Use across frontend, backend, and desktop
- Enables type-safety and better DX with Zod + Prisma

### 8. **Turborepo**
- Monorepo management
- Shared packages for db, validation, api, ui

---

## 🔐 Authentication Flow

| Role       | Method             | Notes |
|------------|--------------------|-------|
| Admin      | NextAuth.js        | Email/password login |
| Employee   | Token activation   | Via link from invite email |
| App Login  | JWT Token          | Stored securely per device |

---

## 🗃️ Database Tables (via Prisma)

```ts
// employees
id, email, name, status, activation_token

// projects
id, name, description, hourly_rate, status

// tasks
id, name, project_id, is_default

// project_assignments
id, employee_id, project_id

// task_assignments
id, employee_id, task_id

// time_entries
id, employee_id, project_id, task_id, started_at, ended_at, duration

// screenshots
id, employee_id, file_path, time_entry_id, captured_at, has_permission

// devices
id, employee_id, mac_address, hostname, last_seen
```

---

## ✅ Features Summary

### Admin Web Dashboard
- Login (NextAuth)
- Create projects
- Add employees and assign them to projects
- View time logs and screenshots

### Employee Onboarding (Web)
- Click activation link
- Set password
- Download app (pre-authenticated)

### Desktop App (Electron)
- Show assigned projects/tasks
- Start/Pause/Stop time tracker
- Capture screenshots every 10 minutes
- Uploads screenshot + logs to API
- Background sync and offline support

---

## 📤 API Endpoints

### Employees
```
GET /api/employees
POST /api/employees
PUT /api/employees/:id
DELETE /api/employees/:id
POST /api/employees/:id/invite
```

### Projects
```
GET /api/projects
POST /api/projects
PUT /api/projects/:id
POST /api/projects/:id/assign
```

### Tasks
```
GET /api/tasks
POST /api/tasks
PUT /api/tasks/:id
DELETE /api/tasks/:id
POST /api/tasks/:id/assign
```

### Time Tracking
```
POST /api/time-entries/start
POST /api/time-entries/stop
GET /api/time-entries
GET /api/time-entries/active
```

### Screenshots
```
POST /api/screenshots/upload
GET /api/screenshots/employee/:id
```

---

## 🔐 Security & Offline Support

- JWT-based API access for desktop app
- Device fingerprinting using MAC + hostname
- Background sync queue when offline
- Screenshot permission checks
- Role-based access for admin vs employee

---

## 🧠 Recommendations

- Use `shadcn/ui` for styling
- Create `zod` schemas in `/packages/validation` and share between app/api
- Use Prisma’s `zod-prisma` to generate Zod types from your schema
- Package Electron app using `electron-builder`
- Run Supabase locally or use hosted
