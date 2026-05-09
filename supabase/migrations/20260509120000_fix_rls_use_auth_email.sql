-- =============================================================================
-- Fix ALL RLS policies that query auth.users directly or call private.is_admin()
--
-- Root cause of "permission denied for table users":
--   The `authenticated` role cannot SELECT from auth.users.
--   Previous migrations used:
--     SELECT raw_user_meta_data->>'email' FROM auth.users WHERE id = auth.uid()
--   This must be replaced with the built-in:
--     auth.email()
--
-- Root cause of private.is_admin() failures:
--   The `authenticated` role may not have EXECUTE on functions in the
--   private schema. Replaced with an inline EXISTS check on public.sales.
--
-- All policies on employees, attendance, leaves, daily_tasks, students are
-- dropped and recreated cleanly below.
-- =============================================================================

-- ── EMPLOYEES ─────────────────────────────────────────────────────────────────
-- Admins see all rows; employees see only their own record (for profile page).
-- Only admins may create, modify, or remove employee records.

DROP POLICY IF EXISTS "employees_select" ON public.employees;
DROP POLICY IF EXISTS "employees_insert" ON public.employees;
DROP POLICY IF EXISTS "employees_update" ON public.employees;
DROP POLICY IF EXISTS "employees_delete" ON public.employees;

CREATE POLICY "employees_select" ON public.employees
    FOR SELECT TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.sales WHERE user_id = auth.uid() AND administrator = TRUE)
        OR email = auth.email()
    );

CREATE POLICY "employees_insert" ON public.employees
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.sales WHERE user_id = auth.uid() AND administrator = TRUE)
    );

CREATE POLICY "employees_update" ON public.employees
    FOR UPDATE TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.sales WHERE user_id = auth.uid() AND administrator = TRUE)
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.sales WHERE user_id = auth.uid() AND administrator = TRUE)
    );

CREATE POLICY "employees_delete" ON public.employees
    FOR DELETE TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.sales WHERE user_id = auth.uid() AND administrator = TRUE)
    );

-- ── ATTENDANCE ────────────────────────────────────────────────────────────────
-- All authenticated users can read attendance (team visibility).
-- Employees can only insert/update their own records; admins can manage all.
-- Only admins can delete attendance records.

DROP POLICY IF EXISTS "attendance_select" ON public.attendance;
DROP POLICY IF EXISTS "attendance_insert" ON public.attendance;
DROP POLICY IF EXISTS "attendance_update" ON public.attendance;
DROP POLICY IF EXISTS "attendance_delete" ON public.attendance;

CREATE POLICY "attendance_select" ON public.attendance
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "attendance_insert" ON public.attendance
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.sales WHERE user_id = auth.uid() AND administrator = TRUE)
        OR employee_id = (
            SELECT id FROM public.employees WHERE email = auth.email() LIMIT 1
        )
    );

CREATE POLICY "attendance_update" ON public.attendance
    FOR UPDATE TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.sales WHERE user_id = auth.uid() AND administrator = TRUE)
        OR employee_id = (
            SELECT id FROM public.employees WHERE email = auth.email() LIMIT 1
        )
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.sales WHERE user_id = auth.uid() AND administrator = TRUE)
        OR employee_id = (
            SELECT id FROM public.employees WHERE email = auth.email() LIMIT 1
        )
    );

CREATE POLICY "attendance_delete" ON public.attendance
    FOR DELETE TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.sales WHERE user_id = auth.uid() AND administrator = TRUE)
    );

-- ── LEAVES ────────────────────────────────────────────────────────────────────
-- All authenticated users can read leaves.
-- Employees can insert their own leave requests and update/delete PENDING ones.
-- Admins can update any leave (approve/reject) and delete any.

DROP POLICY IF EXISTS "leaves_select" ON public.leaves;
DROP POLICY IF EXISTS "leaves_insert" ON public.leaves;
DROP POLICY IF EXISTS "leaves_update" ON public.leaves;
DROP POLICY IF EXISTS "leaves_delete" ON public.leaves;

CREATE POLICY "leaves_select" ON public.leaves
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "leaves_insert" ON public.leaves
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.sales WHERE user_id = auth.uid() AND administrator = TRUE)
        OR employee_id = (
            SELECT id FROM public.employees WHERE email = auth.email() LIMIT 1
        )
    );

CREATE POLICY "leaves_update" ON public.leaves
    FOR UPDATE TO authenticated
    USING (
        -- Admins can approve/reject any leave
        EXISTS (SELECT 1 FROM public.sales WHERE user_id = auth.uid() AND administrator = TRUE)
        OR (
            -- Employees can only withdraw/edit their own pending leave
            status = 'pending'
            AND employee_id = (
                SELECT id FROM public.employees WHERE email = auth.email() LIMIT 1
            )
        )
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.sales WHERE user_id = auth.uid() AND administrator = TRUE)
        OR (
            status = 'pending'
            AND employee_id = (
                SELECT id FROM public.employees WHERE email = auth.email() LIMIT 1
            )
        )
    );

CREATE POLICY "leaves_delete" ON public.leaves
    FOR DELETE TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.sales WHERE user_id = auth.uid() AND administrator = TRUE)
        OR (
            status = 'pending'
            AND employee_id = (
                SELECT id FROM public.employees WHERE email = auth.email() LIMIT 1
            )
        )
    );

-- ── DAILY TASKS ───────────────────────────────────────────────────────────────
-- All authenticated users can read tasks.
-- Employees can insert/update their own tasks; admins can manage all.
-- Employees can also delete their own tasks (pending); admins can delete any.

DROP POLICY IF EXISTS "daily_tasks_select" ON public.daily_tasks;
DROP POLICY IF EXISTS "daily_tasks_insert" ON public.daily_tasks;
DROP POLICY IF EXISTS "daily_tasks_update" ON public.daily_tasks;
DROP POLICY IF EXISTS "daily_tasks_delete" ON public.daily_tasks;

CREATE POLICY "daily_tasks_select" ON public.daily_tasks
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "daily_tasks_insert" ON public.daily_tasks
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.sales WHERE user_id = auth.uid() AND administrator = TRUE)
        OR employee_id = (
            SELECT id FROM public.employees WHERE email = auth.email() LIMIT 1
        )
    );

CREATE POLICY "daily_tasks_update" ON public.daily_tasks
    FOR UPDATE TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.sales WHERE user_id = auth.uid() AND administrator = TRUE)
        OR employee_id = (
            SELECT id FROM public.employees WHERE email = auth.email() LIMIT 1
        )
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.sales WHERE user_id = auth.uid() AND administrator = TRUE)
        OR employee_id = (
            SELECT id FROM public.employees WHERE email = auth.email() LIMIT 1
        )
    );

CREATE POLICY "daily_tasks_delete" ON public.daily_tasks
    FOR DELETE TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.sales WHERE user_id = auth.uid() AND administrator = TRUE)
        OR employee_id = (
            SELECT id FROM public.employees WHERE email = auth.email() LIMIT 1
        )
    );

-- ── STUDENTS ─────────────────────────────────────────────────────────────────
-- All authenticated users can read, insert, update students.
-- Only admins can delete student records (keeps lead history intact).

DROP POLICY IF EXISTS "students_delete" ON public.students;

CREATE POLICY "students_delete" ON public.students
    FOR DELETE TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.sales WHERE user_id = auth.uid() AND administrator = TRUE)
    );
