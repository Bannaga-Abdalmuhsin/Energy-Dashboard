-- stc COW Energy Management Platform — initial Supabase schema
create extension if not exists "uuid-ossp";

create table if not exists public.sites (
  id uuid primary key default uuid_generate_v4(), site_id text unique not null,
  region text not null, district text, city text, latitude numeric, longitude numeric,
  power_source text, generator_capacity_kw numeric, tank_capacity_l numeric,
  status text default 'ON-AIR', created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.energy_readings (
  id bigint generated always as identity primary key, site_id text references public.sites(site_id) on delete cascade,
  recorded_at timestamptz not null, power_kw numeric default 0, energy_kwh numeric default 0,
  generator_load_pct numeric, source text, created_at timestamptz default now()
);
create table if not exists public.fuel_transactions (
  id bigint generated always as identity primary key, site_id text references public.sites(site_id) on delete cascade,
  transaction_at timestamptz not null, quantity_l numeric not null, transaction_type text check (transaction_type in ('delivery','consumption','adjustment')),
  tank_level_pct numeric, supplier text, driver text, notes text, created_at timestamptz default now()
);
create table if not exists public.emission_readings (
  id bigint generated always as identity primary key, site_id text references public.sites(site_id) on delete cascade,
  recorded_at timestamptz not null, scope_1_tco2e numeric default 0, scope_2_tco2e numeric default 0,
  avoided_tco2e numeric default 0, calculation_version text default 'v1', created_at timestamptz default now()
);
create table if not exists public.alerts (
  id bigint generated always as identity primary key, site_id text references public.sites(site_id) on delete cascade,
  alert_type text not null, severity text check (severity in ('info','warning','critical')),
  message text not null, status text default 'open', raised_at timestamptz default now(), resolved_at timestamptz
);
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade, full_name text, role text default 'viewer' check (role in ('admin','manager','viewer')),
  region text, created_at timestamptz default now()
);

alter table public.sites enable row level security;
alter table public.energy_readings enable row level security;
alter table public.fuel_transactions enable row level security;
alter table public.emission_readings enable row level security;
alter table public.alerts enable row level security;
alter table public.profiles enable row level security;
create policy "Authenticated users read sites" on public.sites for select to authenticated using (true);
create policy "Authenticated users read energy" on public.energy_readings for select to authenticated using (true);
create policy "Authenticated users read fuel" on public.fuel_transactions for select to authenticated using (true);
create policy "Authenticated users read emissions" on public.emission_readings for select to authenticated using (true);
create policy "Authenticated users read alerts" on public.alerts for select to authenticated using (true);
create policy "Users read own profile" on public.profiles for select to authenticated using (auth.uid() = id);
