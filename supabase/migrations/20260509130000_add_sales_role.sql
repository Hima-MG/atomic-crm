-- =============================================================================
-- Add `role` column to public.sales
--
-- Three roles:
--   'admin'    — full access: HR dashboard, all EMS, CRM
--   'cre'      — CRM Executive: employee workspace + student CRM only
--   'employee' — employee workspace only: attendance, leaves, daily tasks
--
-- The existing `administrator` boolean is kept and stays authoritative for
-- RLS policies (no change to security). The `role` field is used by the
-- frontend only for navigation and access control.
-- =============================================================================

ALTER TABLE public.sales
    ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'employee'
    CHECK (role IN ('admin', 'cre', 'employee'));

-- Sync from the existing administrator flag so current users get correct role
UPDATE public.sales
    SET role = 'admin'
    WHERE administrator = TRUE AND role = 'employee';

-- Expose role in the sales RLS select policy for identity reads
-- (No change needed — the existing sales policies already allow users to read
--  their own sales record, so the new `role` column is automatically visible.)
