# Civilezy CRM — Production Deployment Guide

## Prerequisites
- Node.js 18+ installed
- Supabase account (supabase.com)
- Vercel account (vercel.com) — free tier is fine

---

## PART 1 — SUPABASE PRODUCTION SETUP

### Step 1: Create Supabase Project
1. Go to https://supabase.com → New Project
2. Name: `civilezy-crm`
3. Password: save securely (e.g. in a password manager)
4. Region: `ap-south-1` (Mumbai) — closest to India
5. Wait ~2 minutes for provisioning

### Step 2: Get Your Credentials
Dashboard → Settings → API:
- Copy **Project URL** → `https://xyzxyz.supabase.co`
- Copy **anon public key** → `eyJ...`
- Copy **service_role secret** → keep this private, never in frontend

### Step 3: Push Database Migrations
```bash
# In your project folder:
npx supabase login              # opens browser, log in once
npx supabase link --project-ref YOUR_PROJECT_REF   # ref is in Settings > General
npx supabase db push            # applies all migrations to production
```

Verify in Supabase Dashboard → Table Editor that these tables exist:
`employees`, `students`, `attendance`, `leaves`, `daily_tasks`, `sales`, `configuration`

### Step 4: Seed Employee Data
Dashboard → SQL Editor → paste and run:

```sql
INSERT INTO employees (name, department, role, email, status) VALUES
  ('Santhosh',             'Management',             'Managing Director, Senior Coach', 'santhoshwincentre@gmail.com',  'active'),
  ('Dr. Anjana R Menon',   'Management',             'Head Coach',                      'anjana.civilezy@gmail.com',    'active'),
  ('Ashwathy V',           'Digital Marketing Team', 'Marketing Executive',             'aswathywincentre@gmail.com',   'active'),
  ('Azmi Alias Jasmine A', 'Accounts',               'Accountant',                      'wincentreacc@gmail.com',       'active'),
  ('Shahil Babu N B',      'IT Team',                'Technical Lead',                  'shahilwincentre@gmail.com',    'active'),
  ('Feba Ray Jacob',       'Content Creator Team',   'Content Coordinator',             'febawincentre@gmail.com',      'active'),
  ('Akash K J',            'Digital Marketing Team', 'Digital Marketer',                'akashkjwincenter@gmail.com',   'active'),
  ('Sajna',                'Content Creator Team',   'Content Developer',               NULL,                           'active'),
  ('Farhana',              'Content Creator Team',   'Content Developer',               NULL,                           'active'),
  ('Shahana',              'Content Creator Team',   'Content Developer',               NULL,                           'active'),
  ('Bhagya',               'Content Creator Team',   'Content Developer',               NULL,                           'active'),
  ('Misiriya',             'Content Creator Team',   'Content Developer',               NULL,                           'active')
ON CONFLICT DO NOTHING;
```

### Step 5: Create Admin Auth Accounts
Dashboard → Authentication → Users → **Add user** (NOT "Invite"):

| Name | Email | Password | Admin? |
|------|-------|----------|--------|
| Santhosh | santhoshwincentre@gmail.com | set strong password | Yes |
| Dr. Anjana | anjana.civilezy@gmail.com | set strong password | Yes |
| Jasmine | wincentreacc@gmail.com | set strong password | Yes |
| Hima | your-email@civilezy.com | set strong password | Yes |

After creating each user, run in SQL Editor:
```sql
UPDATE sales SET administrator = true
WHERE email IN (
  'santhoshwincentre@gmail.com',
  'anjana.civilezy@gmail.com',
  'wincentreacc@gmail.com',
  'your-email@civilezy.com'   -- replace with Hima's email
);
```

### Step 6: Create Storage Bucket
Dashboard → Storage → New bucket:
- Name: `attachments`
- Public: **No** (private)
- Click Create

### Step 7: Verify RLS is Active
SQL Editor → run:
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```
Every row should show `rowsecurity = true`.

---

## PART 2 — BUILD THE APP

### Step 1: Create Production Environment File
In your project folder, create a file named `.env.production`:
```
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SB_PUBLISHABLE_KEY=your_anon_key_here
VITE_IS_DEMO=false
VITE_ATTACHMENTS_BUCKET=attachments
```

**Important:** Never commit this file. It is already in `.gitignore`.

### Step 2: Build
```bash
npm run build
```

Output goes to the `dist/` folder. Check for any build errors.

### Step 3: Test the Build Locally (Optional)
```bash
npm run preview
```
Opens at http://localhost:4173 — verify login works before deploying.

---

## PART 3 — DEPLOY TO VERCEL

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login
```bash
vercel login
```
Opens browser — log in with your Vercel account.

### Step 3: Deploy
```bash
vercel --prod
```

When prompted:
- **Set up and deploy?** → Y
- **Which scope?** → your account
- **Link to existing project?** → N (first time)
- **Project name?** → `civilezy-crm`
- **In which directory is your code?** → `.` (current folder)
- **Want to override settings?** → N

### Step 4: Set Environment Variables in Vercel
Vercel Dashboard → Your Project → Settings → Environment Variables:

Add these (set to **Production** environment):
| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | `https://YOUR_PROJECT_REF.supabase.co` |
| `VITE_SB_PUBLISHABLE_KEY` | your anon key |
| `VITE_IS_DEMO` | `false` |
| `VITE_ATTACHMENTS_BUCKET` | `attachments` |

After adding variables, redeploy:
```bash
vercel --prod
```

Your app is now live at: `https://civilezy-crm.vercel.app`

### Step 5: Connect a Custom Domain (Optional)
Vercel Dashboard → Project → Settings → Domains → Add:
- Enter: `crm.civilezy.com` (or whatever you want)
- Follow DNS instructions (add CNAME record in your domain registrar)
- SSL is automatic — Vercel handles it

---

## PART 4 — SUPABASE AUTH CONFIGURATION

### Allow Your Production Domain
Supabase Dashboard → Authentication → URL Configuration:

- **Site URL:** `https://civilezy-crm.vercel.app` (or your custom domain)
- **Redirect URLs:** Add `https://civilezy-crm.vercel.app/**`

Without this, login redirects will fail in production.

### Email Templates (Optional)
Dashboard → Authentication → Email Templates:
- Customize "Confirm signup" and "Reset password" emails with Civilezy branding.

---

## PART 5 — POST-DEPLOYMENT VERIFICATION

Test in this order after going live:

1. Open the production URL — should show login page
2. Log in as Santhosh (admin) — should see full nav including Student Leads + HR & EMS
3. Navigate to Students → can see CRM ✓
4. Navigate to HR Dashboard → can see stats ✓
5. Log out → log in as an employee account
6. Should NOT see Student Leads tab ✓
7. Should NOT see HR Dashboard in dropdown ✓
8. Navigate to `/students` manually → should redirect to dashboard ✓
9. Submit an attendance record → appears in list ✓
10. Submit a leave request → appears with Pending status ✓

---

## TROUBLESHOOTING

### "Invalid API key"
→ Check `VITE_SB_PUBLISHABLE_KEY` in Vercel env vars matches the anon key exactly.

### "User not found" after login
→ The user exists in Auth but not in the `sales` table.
Run: `SELECT * FROM auth.users WHERE email = 'their@email.com';`
If the trigger didn't fire, manually insert:
```sql
INSERT INTO sales (user_id, first_name, last_name, email)
VALUES ('uuid-from-auth-users', 'First', 'Last', 'their@email.com');
```

### Login redirects to wrong URL
→ Supabase Dashboard → Authentication → URL Configuration → add your production domain.

### White screen after deploy
→ Check Vercel deployment logs. Usually a missing env variable.
Run `vercel logs` or check the Functions tab in Vercel dashboard.

### RLS blocking all queries
→ Someone deleted the authenticated user's `sales` row.
→ Check `SELECT * FROM sales WHERE user_id = auth.uid();` returns a row.

---

## FINAL PRE-LAUNCH CHECKLIST

### Security
- [ ] `VITE_IS_DEMO=false` in production env
- [ ] Service role key NOT in any frontend file
- [ ] All migrations applied (`npx supabase db push`)
- [ ] RLS enabled on all tables (verified via SQL above)
- [ ] Admin accounts created and `sales.administrator = true`
- [ ] Storage bucket created as **private**

### Access Control
- [ ] Admin login: Student Leads tab visible
- [ ] Employee login: Student Leads tab hidden
- [ ] Employee login: HR Dashboard hidden from dropdown
- [ ] Employee cannot navigate to `/students` directly
- [ ] Employee cannot edit/delete other employees

### Performance
- [ ] Source maps disabled (`VITE_SOURCEMAP` not set)
- [ ] Build completes without errors (`npm run build`)
- [ ] No console errors on first load

### Data
- [ ] All 12 employees seeded
- [ ] Admin users have `administrator = true` in sales table
- [ ] Supabase Auth Site URL set to production domain

### Monitoring (Recommended)
- Enable Supabase Database → Logs → Query Performance
- Supabase Dashboard → Reports → API usage
- Vercel Analytics (free tier available)
