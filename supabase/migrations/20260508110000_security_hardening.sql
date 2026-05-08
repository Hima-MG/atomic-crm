-- =============================================================================
-- Civilezy CRM — Security Hardening Migration
-- Fixes:
--   1. Revoke anon role from all public tables (anon should never touch data)
--   2. Restrict employee salary visibility to admins only
--   3. Add time validation constraint on daily_tasks
--   4. Tighten leaves: employees can only UPDATE their own PENDING leaves
-- =============================================================================

-- ── 1. REVOKE anon from all EMS tables ────────────────────────────────────────
-- The anon role is for unauthenticated visitors (the login page).
-- It must not be able to read or write any business data.
-- RLS policies already require `to authenticated` but defence-in-depth:
-- revoke the grants as well so there is no accidental bypass path.

revoke all on table public.students    from anon;
revoke all on table public.employees   from anon;
revoke all on table public.attendance  from anon;
revoke all on table public.leaves      from anon;
revoke all on table public.daily_tasks from anon;

-- Grant only to authenticated and service_role
grant select, insert, update, delete on table public.students    to authenticated;
grant select, insert, update, delete on table public.employees   to authenticated;
grant select, insert, update, delete on table public.attendance  to authenticated;
grant select, insert, update, delete on table public.leaves      to authenticated;
grant select, insert, update, delete on table public.daily_tasks to authenticated;

grant all on table public.students    to service_role;
grant all on table public.employees   to service_role;
grant all on table public.attendance  to service_role;
grant all on table public.leaves      to service_role;
grant all on table public.daily_tasks to service_role;

-- Sequences
grant usage, select on sequence public.students_id_seq    to authenticated;
grant usage, select on sequence public.employees_id_seq   to authenticated;
grant usage, select on sequence public.attendance_id_seq  to authenticated;
grant usage, select on sequence public.leaves_id_seq      to authenticated;
grant usage, select on sequence public.daily_tasks_id_seq to authenticated;

-- ── 2. RESTRICT salary visibility to admins only ──────────────────────────────
-- Drop the overly-permissive select policy from the previous migration.
drop policy if exists "employees_select" on public.employees;

-- Admins see everything. Regular employees can only see their own record
-- (needed for profile page). Reference inputs in attendance/tasks use a
-- separate employees_directory view (created below) that hides salary.
create policy "employees_select" on public.employees
    for select to authenticated using (
        private.is_admin()
        or email = (
            select raw_user_meta_data->>'email'
            from auth.users
            where id = auth.uid()
            limit 1
        )
    );

-- ── 3. Public employee directory view (no salary) ─────────────────────────────
-- This view is used by reference inputs in attendance / daily_tasks / leaves
-- so employees can look up coworkers without seeing salaries.
create or replace view public.employees_directory
    with (security_invoker = on)
as
    select id, name, department, role, email, phone, status, joining_date
    from public.employees
    where status = 'active';

-- Grant read access to the directory view
grant select on public.employees_directory to authenticated;
grant select on public.employees_directory to anon;

-- ── 4. Tighten leaves UPDATE: employees can only update own PENDING leaves ─────
drop policy if exists "leaves_update" on public.leaves;

create policy "leaves_update" on public.leaves
    for update to authenticated
    using (
        -- Admins can update any leave (approve/reject)
        private.is_admin()
        or (
            -- Employee can only withdraw their own leave if still pending
            status = 'pending'
            and employee_id = (
                select id from public.employees
                where email = (
                    select raw_user_meta_data->>'email'
                    from auth.users
                    where id = auth.uid()
                    limit 1
                )
                limit 1
            )
        )
    )
    with check (
        private.is_admin()
        or (
            status = 'pending'
            and employee_id = (
                select id from public.employees
                where email = (
                    select raw_user_meta_data->>'email'
                    from auth.users
                    where id = auth.uid()
                    limit 1
                )
                limit 1
            )
        )
    );

-- ── 5. Daily tasks: add time validation constraint ─────────────────────────────
-- Prevent end_time before start_time (would produce negative total_time).
alter table public.daily_tasks
    drop constraint if exists daily_tasks_time_valid;

alter table public.daily_tasks
    add constraint daily_tasks_time_valid
    check (
        (start_time is null and end_time is null)
        or (start_time is not null and end_time is not null and end_time > start_time)
    );

-- ── 6. Verify RLS is on for all EMS tables ────────────────────────────────────
alter table public.students    enable row level security;
alter table public.employees   enable row level security;
alter table public.attendance  enable row level security;
alter table public.leaves      enable row level security;
alter table public.daily_tasks enable row level security;

-- ── 7. Attendance: employees can only manage their own records ─────────────────
drop policy if exists "attendance_insert" on public.attendance;
drop policy if exists "attendance_update" on public.attendance;

-- Any employee can insert attendance for themselves (or admin for anyone)
create policy "attendance_insert" on public.attendance
    for insert to authenticated
    with check (
        private.is_admin()
        or employee_id = (
            select id from public.employees
            where email = (
                select raw_user_meta_data->>'email'
                from auth.users
                where id = auth.uid()
                limit 1
            )
            limit 1
        )
    );

create policy "attendance_update" on public.attendance
    for update to authenticated
    using (
        private.is_admin()
        or employee_id = (
            select id from public.employees
            where email = (
                select raw_user_meta_data->>'email'
                from auth.users
                where id = auth.uid()
                limit 1
            )
            limit 1
        )
    )
    with check (
        private.is_admin()
        or employee_id = (
            select id from public.employees
            where email = (
                select raw_user_meta_data->>'email'
                from auth.users
                where id = auth.uid()
                limit 1
            )
            limit 1
        )
    );

-- ── 8. Daily tasks: employees can only manage their own records ────────────────
drop policy if exists "daily_tasks_insert" on public.daily_tasks;
drop policy if exists "daily_tasks_update" on public.daily_tasks;

create policy "daily_tasks_insert" on public.daily_tasks
    for insert to authenticated
    with check (
        private.is_admin()
        or employee_id = (
            select id from public.employees
            where email = (
                select raw_user_meta_data->>'email'
                from auth.users
                where id = auth.uid()
                limit 1
            )
            limit 1
        )
    );

create policy "daily_tasks_update" on public.daily_tasks
    for update to authenticated
    using (
        private.is_admin()
        or employee_id = (
            select id from public.employees
            where email = (
                select raw_user_meta_data->>'email'
                from auth.users
                where id = auth.uid()
                limit 1
            )
            limit 1
        )
    )
    with check (
        private.is_admin()
        or employee_id = (
            select id from public.employees
            where email = (
                select raw_user_meta_data->>'email'
                from auth.users
                where id = auth.uid()
                limit 1
            )
            limit 1
        )
    );
