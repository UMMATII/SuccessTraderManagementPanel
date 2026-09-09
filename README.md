# Success Trader Management Panel

A professional, full-stack enterprise web application for **Success Traders** providing complete employee management, attendance roll calls, daily task tracking with overlap validation, success points awards, performance analytics, and multi-tier trader rankings.

---

## 🌟 Key Features

### 👑 Owner Portal (`/admin/*`)
- **Owner Dashboard (`/admin/dashboard`)**:
  - Real-time KPIs: Total Traders, Active Traders, Today's Attendance, Today's Tasks, Monthly Success Points, and Average Working Hours.
  - Interactive Recharts analytics: Working Hours by Trader, Success Points Distribution, Daily Firm Performance Trend, and Attendance Status Breakdown.
  - Monthly Top 5 Trader Podium preview.
- **Trader Management (`/admin/employees`)**:
  - Search traders by name or ID.
  - Filter by Active/Inactive status.
  - Create new Trader accounts with email, temporary password, joining date, and status.
  - View individual trader dossiers (`/admin/employees/:id`) with tabbed attendance logs, tasks history, and point records.
  - Edit trader details, toggle status (Activate / Deactivate), and dispatch password reset emails.
- **Attendance Administration (`/admin/attendance`)**:
  - Filter by date, trader, and status (`PRESENT`, `ABSENT`, `LEAVE`, `HOLIDAY`).
  - Modal to log or update attendance for any team member with check-in/out times and notes.
- **Daily Task Records (`/admin/tasks`)**:
  - Full visibility into all trader work sessions across the firm.
  - Duration summaries and search across task descriptions and acceptance criteria.
- **Performance Analytics (`/admin/performance`)**:
  - Trader benchmark summary table with average points per day, task volume, and working hours.
- **Success Points Center (`/admin/success-points`)**:
  - Award performance points (points $\ge 0$) with mandatory justification and optional linkage to specific daily tasks.
  - Immutable audit logging on award.
  - Ability to revoke points if necessary.
- **Trader Leaderboard & Rankings (`/admin/rankings`)**:
  - Multi-tier ranking algorithm:
    1. **Primary**: Success Points (descending)
    2. **Secondary**: Completed Tasks (descending)
    3. **Tertiary**: Working Hours (descending)
  - Top 3 Podium (Gold, Silver, Bronze) with monthly and yearly filters.
- **Security Audit Logs (`/admin/audit-logs`)**:
  - Captures `CREATE_EMPLOYEE`, `UPDATE_EMPLOYEE`, `ACTIVATE_EMPLOYEE`, `DEACTIVATE_EMPLOYEE`, `RESET_PASSWORD`, `CREATE_TASK`, `UPDATE_TASK`, `CREATE_ATTENDANCE`, `UPDATE_ATTENDANCE`, `AWARD_SUCCESS_POINTS`.
  - Displays user, action badge, entity type, and JSON state diffs.
- **System Settings (`/admin/settings`)**:
  - Supabase connectivity status, RLS verification, and Owner profile settings.

---

### 💻 Trader / Employee Portal (`/employee/*`)
- **Trader Dashboard (`/employee/dashboard`)**:
  - Personal KPI cards: Today's Tasks, Today's Working Time, Monthly Tasks, Monthly Working Hours, Success Points, and Leaderboard Rank.
  - Today's work session table with direct quick-action to log new tasks.
  - Daily hours and task output chart.
- **My Tasks (`/employee/tasks`)**:
  - Comprehensive history of personal trade analysis and backtesting logs.
  - Search and date filters.
  - Edit or delete personal tasks.
- **Log Daily Task (`/employee/tasks/new`)**:
  - Task submission form: Date, Description, Time From, Time To, Acceptance Criteria.
  - Real-time automatic calculation of duration in integer minutes.
  - **Task Overlap Validation**: Prohibits overlapping intervals for the same trader on the same date (e.g. 09:00–11:00 vs 10:30–12:00) with the error message: *"This task overlaps with an existing task period."*
- **My Attendance (`/employee/attendance`)**:
  - Roll call log showing presence, check-in, check-out, and approved leave.
- **My Performance (`/employee/performance`)**:
  - Monthly working hours, completed task counts, and success points trend.
- **Trader Profile (`/employee/profile`)**:
  - View account details.
  - Update display name and avatar URL (Trader ID, Status, and Role are read-only and secured by database RLS).
- **Settings & Security (`/employee/settings`)**:
  - Password update form and secure session sign out.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | React 19 + Vite 8 + TypeScript |
| **Styling** | Tailwind CSS v4 |
| **Icons** | Lucide React |
| **Routing** | React Router v7 |
| **State Management** | Zustand |
| **Forms & Validation** | React Hook Form + Zod |
| **Charts** | Recharts |
| **Dates & Times** | date-fns |
| **Notifications** | Sonner |
| **Backend & Database** | Supabase (PostgreSQL 15+, Supabase Auth, Row Level Security) |

---

## 🗄️ Database Architecture & Migrations

All database definitions are located in [`supabase/migrations/001_initial_schema.sql`](file:///e:/Ummatii/supabase/migrations/001_initial_schema.sql):
- **`profiles`**: Linked 1-to-1 with `auth.users(id)` (`id`, `employee_id`, `name`, `role`, `status`, `joining_date`, `avatar_url`).
- **`tasks`**: Daily work records with duration checks (`duration_minutes > 0`, `time_to > time_from`) and automated overlap validation trigger `trg_validate_task_overlap`.
- **`attendance`**: Daily attendance records with unique constraint `(employee_id, attendance_date)`.
- **`success_points`**: Points awarded by Owner with `awarded_by` foreign key and audit logging.
- **`audit_logs`**: Administrative and security event history.

### Database Functions & Triggers
- `is_owner(p_user_id uuid)`: Security definer function preventing recursive RLS checks.
- `check_task_overlap()`: Database trigger enforcing non-overlapping task intervals.
- `calculate_task_duration()`: Deterministic duration calculator.
- `get_monthly_employee_statistics()`: Aggregation function for leaderboard and analytics.
- `handle_new_user()`: Automated profile generation on Supabase Auth user registration.

---

## 🚀 Setup & Execution Guide

### 1. Configure Supabase Credentials
Copy `.env.example` to `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

### 2. Apply Database Migrations in Supabase
In your Supabase project dashboard:
1. Navigate to **SQL Editor**.
2. Open [`supabase/migrations/001_initial_schema.sql`](file:///e:/Ummatii/supabase/migrations/001_initial_schema.sql) and run the script.
3. *(Optional)* Run [`supabase/seed/seed.sql`](file:///e:/Ummatii/supabase/seed/seed.sql) to populate sample profiles, attendance records, tasks, and success points.

### 3. Run Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

> [!TIP]
> **Built-in Quick Role Switcher**: If you haven't linked your live Supabase database yet, you can preview all features immediately using the **Owner Mode** and **Employee Mode** buttons on the login screen or in the top guidance banner.

---

## 🚢 CI / CD & Vercel Deployment

The repository includes a ready-to-use continuous integration and continuous deployment pipeline using **GitHub Actions** and **Vercel**:
- [`vercel.json`](file:///e:/Ummatii/vercel.json): Configures client-side SPA route rewrites to `/index.html` and security response headers.
- [`.github/workflows/ci-cd.yml`](file:///e:/Ummatii/.github/workflows/ci-cd.yml): Automated workflow that checks linting, verifies TypeScript builds, creates Preview deployments on Pull Requests, and automatically deploys to Production on pushes to `main`.

### Required GitHub Repository Secrets
To enable automated deployments, add these secrets in **GitHub Repository Settings -> Secrets and variables -> Actions**:
1. `VERCEL_TOKEN`: Your Vercel Personal Access Token ([Vercel Account Settings -> Tokens](https://vercel.com/account/tokens)).
2. `VERCEL_ORG_ID`: Your Vercel Team/User ID (found in `.vercel/project.json` or team settings).
3. `VERCEL_PROJECT_ID`: Your Vercel Project ID (found in Project Settings -> General).
4. `VITE_SUPABASE_URL`: Your Supabase Project URL.
5. `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Public Key.

