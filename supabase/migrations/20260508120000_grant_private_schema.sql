-- =============================================================================
-- Grant authenticated role access to private schema functions
--
-- The private.is_admin() function is used in RLS policies on employees,
-- attendance, leaves, and daily_tasks tables. Without EXECUTE permission,
-- PostgREST returns HTTP 403 when authenticated users query these tables,
-- which ra-supabase-core's checkError interprets as a session error and
-- redirects the user to the login page.
-- =============================================================================

-- Allow the authenticated role to resolve names in the private schema
GRANT USAGE ON SCHEMA private TO authenticated;

-- Allow the authenticated role to call private.is_admin()
-- (SECURITY DEFINER means it runs as postgres, but the caller still needs EXECUTE)
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;

-- Grant to service_role as well for Edge Functions and admin operations
GRANT USAGE ON SCHEMA private TO service_role;
GRANT EXECUTE ON FUNCTION private.is_admin() TO service_role;
