INSERT INTO employees (name, department, role, email, status)
VALUES
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
  ('Bhagya',              'Content Creator Team',   'Content Developer',               NULL,                           'active'),
  ('Misiriya',             'Content Creator Team',   'Content Developer',               NULL,                           'active')
ON CONFLICT DO NOTHING;
ALTER TABLE daily_tasks
  ADD COLUMN IF NOT EXISTS category   text,
  ADD COLUMN IF NOT EXISTS start_time time,
  ADD COLUMN IF NOT EXISTS end_time   time,
  ADD COLUMN IF NOT EXISTS total_time numeric(5, 2);