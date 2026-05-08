-- Migration: Enhance daily_tasks with category, time tracking fields
-- Replaces the department-based grouping with proper task categories
-- and adds start/end time for automatic hours calculation.

-- 1. Add new columns ---------------------------------------------------------

ALTER TABLE daily_tasks
  ADD COLUMN IF NOT EXISTS category       text,
  ADD COLUMN IF NOT EXISTS start_time     time,
  ADD COLUMN IF NOT EXISTS end_time       time,
  ADD COLUMN IF NOT EXISTS total_time     numeric(5, 2);

-- 2. Back-fill category from department for existing rows --------------------
--    (so existing data isn't lost)

UPDATE daily_tasks
SET category = CASE department
  WHEN 'IT Team'                 THEN 'Website & App Management'
  WHEN 'Digital Marketing Team'  THEN 'Social Media'
  WHEN 'Content Creator Team'    THEN 'Content Creation'
  ELSE 'Miscellaneous'
END
WHERE category IS NULL;

-- 3. Add CHECK constraint on category ----------------------------------------

ALTER TABLE daily_tasks
  ADD CONSTRAINT daily_tasks_category_check
  CHECK (
    category IN (
      'Content Creation',
      'Video/Reel Preparation',
      'Website & App Management',
      'Student Support',
      'Admissions & Enrollments',
      'Social Media',
      'Admin & Accounts',
      'Meetings/Sessions',
      'Research & Learning',
      'Miscellaneous'
    )
  );

-- 4. Auto-calculate total_time trigger ---------------------------------------

CREATE OR REPLACE FUNCTION private.calc_task_total_time()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.start_time IS NOT NULL AND NEW.end_time IS NOT NULL THEN
    NEW.total_time := ROUND(
      EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 3600.0,
      2
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_calc_task_total_time ON daily_tasks;

CREATE TRIGGER trg_calc_task_total_time
  BEFORE INSERT OR UPDATE OF start_time, end_time ON daily_tasks
  FOR EACH ROW
  EXECUTE FUNCTION private.calc_task_total_time();

-- 5. Performance index -------------------------------------------------------

CREATE INDEX IF NOT EXISTS daily_tasks_category_date_idx
  ON daily_tasks (category, submission_date DESC);

-- 6. Update employees department constraint to include new departments --------

ALTER TABLE employees
  DROP CONSTRAINT IF EXISTS employees_department_check;

ALTER TABLE employees
  ADD CONSTRAINT employees_department_check
  CHECK (
    department IN (
      'Management',
      'IT Team',
      'Digital Marketing Team',
      'Content Creator Team',
      'Accounts',
      'HR'
    )
  );
