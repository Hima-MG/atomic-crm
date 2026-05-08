-- =============================================================================
-- Civilezy CRM — Employee Seed Data
-- =============================================================================
-- Run this AFTER applying all migrations:
--   npx supabase migration up --local
--   psql $DATABASE_URL -f supabase/seed_civilezy_employees.sql
--
-- For Supabase Auth users, create accounts via the Supabase Dashboard or
-- use the edge function endpoint. This script only seeds the employees table.
-- =============================================================================

INSERT INTO employees (name, department, role, email, status)
VALUES
  ('Santhosh',          'Management',              'Managing Director, Senior Coach',  'santhoshwincentre@gmail.com',   'active'),
  ('Dr. Anjana R Menon','Management',              'Head Coach',                        'anjana.civilezy@gmail.com',     'active'),
  ('Ashwathy V',        'Digital Marketing Team',  'Marketing Executive',               'aswathywincentre@gmail.com',    'active'),
  ('Azmi Alias Jasmine A','Accounts',              'Accountant',                        'wincentreacc@gmail.com',        'active'),
  ('Shahil Babu N B',   'IT Team',                 'Technical Lead',                    'shahilwincentre@gmail.com',     'active'),
  ('Feba Ray Jacob',    'Content Creator Team',    'Content Coordinator',               'febawincentre@gmail.com',       'active'),
  ('Akash K J',         'Digital Marketing Team',  'Digital Marketer',                  'akashkjwincenter@gmail.com',    'active'),
  ('Sajna',             'Content Creator Team',    'Content Developer',                 NULL,                            'active'),
  ('Farhana',           'Content Creator Team',    'Content Developer',                 NULL,                            'active'),
  ('Shahana',           'Content Creator Team',    'Content Developer',                 NULL,                            'active'),
  ('Bhagya',            'Content Creator Team',    'Content Developer',                 NULL,                            'active'),
  ('Misiriya',          'Content Creator Team',    'Content Developer',                 NULL,                            'active')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- Auth users for admin accounts (Santhosh & Dr. Anjana)
-- =============================================================================
-- These cannot be created via SQL alone — use one of these methods:
--
-- Option A — Supabase Dashboard:
--   1. Go to Authentication → Users → Invite user
--   2. Enter email and invite
--   3. User sets own password via email link
--
-- Option B — Edge function (after deployment):
--   POST /functions/v1/user-management
--   { "email": "santhoshwincentre@gmail.com", "first_name": "Santhosh", "last_name": "", "administrator": true }
--   { "email": "anjana.civilezy@gmail.com", "first_name": "Dr. Anjana", "last_name": "R Menon", "administrator": true }
--
-- Option C — Local dev only (direct SQL to auth schema):
-- INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, role)
-- VALUES ('santhoshwincentre@gmail.com', crypt('ChangeMe123!', gen_salt('bf')), now(), 'authenticated')
-- ON CONFLICT DO NOTHING;
-- =============================================================================
