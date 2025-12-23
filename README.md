# SD-Monitoring Dashboard

A real-time Service Desk Monitoring Dashboard built with Next.js 15 that displays IT infrastructure health status for Backups and VM Failovers.

## Features

- 📊 **Real-time Dashboard** - Auto-refreshing status display
- 🔄 **Supabase Integration** - Cloud database for data storage
- 📡 **API Ingestion** - REST endpoints for data push from source servers
- ⚙️ **Configurable Settings** - Adjustable refresh interval and data retention
- 📈 **Ingestion Monitoring** - Track data pipeline health and errors
- 🎨 **Dark Theme UI** - Professional dark mode interface

## Tech Stack

- **Framework**: Next.js 15 (App Router, TypeScript)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Run Database Migration

Execute `supabase/migrations/001_initial_schema.sql` in your Supabase SQL Editor.

### 4. Start Development Server

```bash
npm run dev
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ingest/backup` | POST | Push backup data |
| `/api/ingest/vm` | POST | Push VM failover data |
| `/api/monitor` | GET | Fetch dashboard data |
| `/api/settings` | GET/PUT | Read/write settings |
| `/api/ingestion/logs` | GET | Fetch ingestion logs |

## PowerShell Scripts

Located in `/scripts/` for pushing data from source servers:

- `Push-BackupData.ps1` - Push backup CSV data
- `Push-VMData.ps1` - Push VM failover CSV data
- `Push-AllData.ps1` - Combined script for scheduled tasks

## License

MIT
