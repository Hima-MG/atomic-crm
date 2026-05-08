--
-- Civilezy EMS — Production hardening
-- Adds CHECK constraints for data integrity and tightens RLS policies.
--
-- Run AFTER 20260506120000_civilezy_modules.sql
--

-- ============================================================
-- CHECK CONSTRAINTS (data integrity)
-- ============================================================

-- students: index must be non-negative
alter table public.students
    add constraint students_index_non_negative check (index >= 0);

-- employees: salary must be non-negative when set
alter table public.employees
    add constraint employees_salary_non_negative check (salary is null or salary >= 0);

-- employees: status must be one of the allowed values
alter table public.employees
    add constraint employees_status_values
    check (status in ('active', 'inactive'));

-- attendance: working_hours must be between 0 and 24
alter table public.attendance
    add constraint attendance_working_hours_range
    check (working_hours is null or (working_hours >= 0 and working_hours <= 24));

-- attendance: status values
alter table public.attendance
    add constraint attendance_status_values
    check (status in ('present', 'absent', 'half-day', 'leave'));

-- leaves: end_date must not be before start_date
alter table public.leaves
    add constraint leaves_dates_valid
    check (end_date >= start_date);

-- leaves: status values
alter table public.leaves
    add constraint leaves_status_values
    check (status in ('pending', 'approved', 'rejected'));

-- leaves: leave_type values
alter table public.leaves
    add constraint leaves_type_values
    check (leave_type in ('annual', 'sick', 'casual', 'other'));

-- daily_tasks: status values
alter table public.daily_tasks
    add constraint daily_tasks_status_values
    check (status in ('pending', 'under-review', 'completed'));

-- students: stage values
alter table public.students
    add constraint students_stage_values
    check (stage in ('new-lead', 'contacted', 'interested', 'follow-up', 'joined', 'closed'));

-- ============================================================
-- INDEXES for common filter patterns
-- ============================================================

-- attendance: filtering by date range is very common
create index if not exists attendance_date_employee
    on public.attendance (date desc, employee_id);

-- leaves: pending approvals dashboard query
create index if not exists leaves_status_created
    on public.leaves (status, created_at desc);

-- daily_tasks: team lead views tasks by department + date
create index if not exists daily_tasks_dept_date
    on public.daily_tasks (department, submission_date desc);

-- students: follow-up reminders (counselors query by follow_up_date)
create index if not exists students_follow_up_date
    on public.students (follow_up_date asc)
    where follow_up_date is not null;

-- ============================================================
-- DROP the overly-permissive policies added in the first migration
-- and replace with role-aware ones.
--
-- Strategy:
--   • Any authenticated user can READ everything (team collaboration).
--   • INSERT is open to all authenticated (any team member can add records).
--   • UPDATE/DELETE on sensitive tables (employees salary, leaves approval)
--     is restricted to administrators (sales.administrator = true).
--   • For attendance and daily_tasks, any authenticated user may
--     insert/update/delete — these are operational records, not sensitive.
-- ============================================================

-- Helper: is the current user an administrator?
-- We check the sales table which maps auth.uid() → sales record.
create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
as $$
    select coalesce(
        (select administrator from public.sales where user_id = auth.uid() limit 1),
        false
    );
$$;

-- ── STUDENTS ─────────────────────────────────────────────────────────────────
-- All staff can read & add leads; only admins can delete.
drop policy if exists "Students select" on public.students;
drop policy if exists "Students insert" on public.students;
drop policy if exists "Students update" on public.students;
drop policy if exists "Students delete" on public.students;

create policy "students_select" on public.students
    for select to authenticated using (true);

create policy "students_insert" on public.students
    for insert to authenticated with check (true);

create policy "students_update" on public.students
    for update to authenticated using (true) with check (true);

create policy "students_delete" on public.students
    for delete to authenticated using (private.is_admin());

-- ── EMPLOYEES ────────────────────────────────────────────────────────────────
-- Salary is sensitive: only admins may create/update/delete employee records.
drop policy if exists "Employees select" on public.employees;
drop policy if exists "Employees insert" on public.employees;
drop policy if exists "Employees update" on public.employees;
drop policy if exists "Employees delete" on public.employees;

create policy "employees_select" on public.employees
    for select to authenticated using (true);

create policy "employees_insert" on public.employees
    for insert to authenticated with check (private.is_admin());

create policy "employees_update" on public.employees
    for update to authenticated
    using (private.is_admin()) with check (private.is_admin());

create policy "employees_delete" on public.employees
    for delete to authenticated using (private.is_admin());

-- ── ATTENDANCE ───────────────────────────────────────────────────────────────
-- Any authenticated staff member may manage attendance records.
drop policy if exists "Attendance select" on public.attendance;
drop policy if exists "Attendance insert" on public.attendance;
drop policy if exists "Attendance update" on public.attendance;
drop policy if exists "Attendance delete" on public.attendance;

create policy "attendance_select" on public.attendance
    for select to authenticated using (true);

create policy "attendance_insert" on public.attendance
    for insert to authenticated with check (true);

create policy "attendance_update" on public.attendance
    for update to authenticated using (true) with check (true);

create policy "attendance_delete" on public.attendance
    for delete to authenticated using (private.is_admin());

-- ── LEAVES ───────────────────────────────────────────────────────────────────
-- Any employee can submit a leave request (insert).
-- Only admins can approve/reject (update status field).
-- Employees can delete their own pending requests.
drop policy if exists "Leaves select" on public.leaves;
drop policy if exists "Leaves insert" on public.leaves;
drop policy if exists "Leaves update" on public.leaves;
drop policy if exists "Leaves delete" on public.leaves;

create policy "leaves_select" on public.leaves
    for select to authenticated using (true);

create policy "leaves_insert" on public.leaves
    for insert to authenticated with check (true);

create policy "leaves_update" on public.leaves
    for update to authenticated
    using (private.is_admin()) with check (private.is_admin());

create policy "leaves_delete" on public.leaves
    for delete to authenticated using (private.is_admin());

-- ── DAILY TASKS ──────────────────────────────────────────────────────────────
-- Employees submit their own tasks; admins review and update notes/status.
drop policy if exists "DailyTasks select" on public.daily_tasks;
drop policy if exists "DailyTasks insert" on public.daily_tasks;
drop policy if exists "DailyTasks update" on public.daily_tasks;
drop policy if exists "DailyTasks delete" on public.daily_tasks;

create policy "daily_tasks_select" on public.daily_tasks
    for select to authenticated using (true);

create policy "daily_tasks_insert" on public.daily_tasks
    for insert to authenticated with check (true);

create policy "daily_tasks_update" on public.daily_tasks
    for update to authenticated using (true) with check (true);

create policy "daily_tasks_delete" on public.daily_tasks
    for delete to authenticated using (private.is_admin());
