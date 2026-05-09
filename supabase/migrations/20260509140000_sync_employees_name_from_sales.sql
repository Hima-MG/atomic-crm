-- Sync employees.name from sales when first_name / last_name is updated.
--
-- Problem: the employees table has its own `name` field that is NOT linked
-- to the sales table. When a new user is invited the sales record gets
-- first_name = 'Pending' / last_name = 'Pending' as defaults, and any
-- employees row created around the same time also ends up with name =
-- 'Pending'. Editing sales.first_name afterwards had no effect on
-- employees.name.
--
-- Fix:
--  1. One-time backfill: update every employees row whose name is still
--     'Pending' or matches 'Pending Pending' by joining on email.
--  2. Trigger: whenever sales.first_name or sales.last_name changes,
--     automatically update the matching employees row (matched by email).

-- ── 1. Backfill existing stale records ────────────────────────────────────────

UPDATE public.employees e
SET    name = trim(s.first_name || ' ' || s.last_name)
FROM   public.sales s
WHERE  lower(e.email) = lower(s.email::text)
  AND  trim(s.first_name || ' ' || s.last_name) NOT IN ('Pending Pending', 'Pending', '')
  AND  (e.name = 'Pending' OR e.name = 'Pending Pending' OR e.name = '');

-- ── 2. Trigger function ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.sync_employee_name_from_sales()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  full_name text;
BEGIN
  full_name := trim(NEW.first_name || ' ' || NEW.last_name);

  -- Only sync when name is actually different and not 'Pending'
  IF full_name IS NOT NULL
     AND full_name NOT IN ('', 'Pending', 'Pending Pending')
     AND (OLD.first_name IS DISTINCT FROM NEW.first_name
          OR OLD.last_name IS DISTINCT FROM NEW.last_name)
  THEN
    UPDATE public.employees
    SET    name = full_name
    WHERE  lower(email) = lower(NEW.email::text);
  END IF;

  RETURN NEW;
END;
$$;

-- ── 3. Attach trigger to sales ────────────────────────────────────────────────

DROP TRIGGER IF EXISTS sync_employee_name_from_sales_trigger ON public.sales;

CREATE TRIGGER sync_employee_name_from_sales_trigger
  AFTER UPDATE OF first_name, last_name ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_employee_name_from_sales();
