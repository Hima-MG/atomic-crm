-- =============================================================================
-- Inline admin check in employees_select RLS policy
--
-- Replaces the call to private.is_admin() with a direct subquery.
-- This removes the dependency on the private schema grant entirely.
-- Functionally identical: admins see all rows, employees see only their own.
-- =============================================================================

DROP POLICY IF EXISTS "employees_select" ON public.employees;

CREATE POLICY "employees_select" ON public.employees
    FOR SELECT TO authenticated
    USING (
        -- Admin check inlined: no private schema grant required
        COALESCE(
            (SELECT administrator FROM public.sales
             WHERE user_id = auth.uid() LIMIT 1),
            false
        )
        OR
        -- Non-admins can see their own employee record
        email = (
            SELECT raw_user_meta_data->>'email'
            FROM auth.users
            WHERE id = auth.uid()
            LIMIT 1
        )
    );
