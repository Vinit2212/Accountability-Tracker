# Lumnicore - Daily Discipline & Accountability Tracker

Lumnicore is a clean, modern, full-stack daily discipline and accountability tracker built with **Next.js (App Router, TypeScript)**, **Tailwind CSS**, **Supabase (PostgreSQL, Auth, RLS)**, and **Recharts**.

---

## Product Features

### Daily Discipline Routine
Every user follows 5 standardized daily tasks:
1. **Wake up by 8:00 AM** (≤ 8:00 AM = 1 pt)
2. **Sleep by 12:30 AM** (≤ 12:30 AM = 1 pt)
3. **Eat clean** (Yes = 1 pt, Mostly = 0.5 pt, No = 0 pt)
4. **Gym on weekdays** (Mon–Fri applicable = 1 pt; Sat–Sun excluded from required score)
5. **Focused study or work** (≥ 5.0 hours = 1 pt)
6. **Drink 3-4Litres of water** (Yes = 1 pt, No = 0 pt)

### Timezone & Scoring Engine
* All calculations strictly operate in the `Asia/Kolkata` (IST) timezone.
* Weekday Max Points = 5. Weekend Max Points = 4.
* Daily Score % = `(Earned Points / Applicable Points) * 100`.
* Daily Score ≥ 80% is required to maintain active streaks. Missing a day breaks the streak.

### Roles & Security
* **User Role**: Submit and edit only their own check-ins for today; view personal history & progress analytics.
* **Admin Role**: Global read-only audit of all registered users & check-ins, search/filter user records, group visual reports, and CSV export. Protected via Supabase Row Level Security (RLS).

---

## Local Setup Instructions

### 1. Clone & Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your Supabase project credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 3. Run Database Migrations in Supabase
Run the migration scripts located in `supabase/migrations/`:
1. `01_schema.sql` (Tables & Auth trigger)
2. `02_rls.sql` (Row Level Security & `is_admin()` helper)

### 4. Create your First Admin Account
1. Register a new user on the `/signup` page (e.g. `admin@lumnicore.com`).
2. Run this SQL query in your Supabase SQL Editor to promote the account to `admin`:
```sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'admin@lumnicore.com';
```

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Run Automated Tests
```bash
npm test
```

---

## Deployment Instructions (Vercel)

1. Push your repository to GitHub.
2. Import the repository in [Vercel](https://vercel.com).
3. Add your Environment Variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) in the Vercel Dashboard under **Settings -> Environment Variables**.
4. Click **Deploy**.

### Connecting the `Lumnicore.com` Domain
1. In your Vercel Project Dashboard, navigate to **Settings -> Domains**.
2. Type `Lumnicore.com` and `www.lumnicore.com` and click **Add**.
3. Configure your DNS provider (e.g., Cloudflare, Namecheap, GoDaddy) with the following records:
   - **A Record**: `@` pointing to `76.76.21.21`
   - **CNAME Record**: `www` pointing to `cname.vercel-dns.com`
4. Once DNS propagates, SSL certificates will generate automatically and `https://lumnicore.com` will be live.
