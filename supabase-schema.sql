-- ═══════════════════════════════════════════════════════════════════════════
-- NHB CONSULTANCY — SUPABASE SCHEMA
-- Run this entire file in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════════════════


-- ─── CONTACTS ───────────────────────────────────────────────────────────────
-- Stores all submissions from the Contact Us form

create table if not exists contacts (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  email       text        not null,
  company     text,
  service     text,
  message     text        not null,
  read        boolean     default false,
  created_at  timestamptz default now()
);

alter table contacts enable row level security;

-- Anyone can submit a contact form
create policy "public_insert_contacts"
  on contacts for insert to anon
  with check (true);

-- Only you (authenticated) can read submissions
create policy "auth_read_contacts"
  on contacts for select to authenticated
  using (true);

-- Only you can update (e.g. mark as read)
create policy "auth_update_contacts"
  on contacts for update to authenticated
  using (true);


-- ─── APPLICATIONS ───────────────────────────────────────────────────────────
-- Stores CV registrations and job applications from the Careers page

create table if not exists applications (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  email       text        not null,
  job_title   text,
  message     text,
  status      text        default 'new',   -- new | reviewing | shortlisted | rejected
  created_at  timestamptz default now()
);

alter table applications enable row level security;

create policy "public_insert_applications"
  on applications for insert to anon
  with check (true);

create policy "auth_read_applications"
  on applications for select to authenticated
  using (true);

create policy "auth_update_applications"
  on applications for update to authenticated
  using (true);


-- ─── JOBS ───────────────────────────────────────────────────────────────────
-- Live job listings — manage these from Supabase dashboard or a future admin panel

create table if not exists jobs (
  id          uuid        primary key default gen_random_uuid(),
  title       text        not null,
  location    text,
  sector      text,           -- Hotels | F&B | Corporate | Events
  type        text        default 'Permanent',
  description text,
  active      boolean     default true,
  created_at  timestamptz default now()
);

alter table jobs enable row level security;

-- Anyone can read active listings
create policy "public_read_jobs"
  on jobs for select to anon
  using (active = true);

-- Only you can create/edit/delete jobs
create policy "auth_manage_jobs"
  on jobs for all to authenticated
  using (true);


-- ─── HEALTH CHECKS ──────────────────────────────────────────────────────────
-- Stores HR Health Check results for lead tracking (email is optional)

create table if not exists health_checks (
  id          uuid        primary key default gen_random_uuid(),
  email       text,
  score       integer,
  grade       text,
  answers     jsonb,
  result      jsonb,
  created_at  timestamptz default now()
);

alter table health_checks enable row level security;

create policy "public_insert_health_checks"
  on health_checks for insert to anon
  with check (true);

create policy "auth_read_health_checks"
  on health_checks for select to authenticated
  using (true);


-- ─── SEED JOBS ──────────────────────────────────────────────────────────────
-- Starter job listings to populate your careers page immediately

insert into jobs (title, location, sector, type) values
  ('Restaurant Manager',    'Dubai Marina',   'F&B',       'Permanent'),
  ('Front Office Manager',  'JBR, Dubai',     'Hotels',    'Permanent'),
  ('HR Manager',            'DIFC, Dubai',    'Corporate', 'Permanent'),
  ('Executive Chef',        'Downtown Dubai', 'F&B',       'Permanent'),
  ('Events Coordinator',    'Business Bay',   'Events',    'Permanent'),
  ('Hotel General Manager', 'DIFC, Dubai',    'Hotels',    'Permanent'),
  ('Revenue Manager',       'Dubai Marina',   'Hotels',    'Permanent'),
  ('HR Business Partner',   'Business Bay',   'Corporate', 'Contract');


-- ═══════════════════════════════════════════════════════════════════════════
-- DONE. Your tables are live.
-- Next: copy your Project URL and Anon Key from Settings → API
-- and add them to your Netlify environment variables.
-- ═══════════════════════════════════════════════════════════════════════════
