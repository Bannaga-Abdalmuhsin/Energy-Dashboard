-- Lossless import target for the Google Sheet "Energy Dashboard" worksheet.
create table if not exists public.energy_dashboard (
  site text primary key,
  source_row integer not null,
  source_index numeric,
  vendor text,
  area text,
  district_name text,
  city_name text,
  power_source text,
  generator_capacity text,
  technology text,
  cow_status text,
  total_on_air_days numeric,
  latitude numeric,
  longitude numeric,
  start_time timestamptz,
  source_as_of timestamptz,
  span_days numeric,
  tank_capacity_l numeric,
  power_demand_kw numeric,
  average_diesel_liters_per_day numeric,
  average_kw numeric,
  co2_tons_per_day numeric,
  current_average_liters_per_day numeric,
  current_average_kw numeric,
  current_co2_tons numeric,
  fuel_tank_level_pct numeric,
  generator_load_factor_pct numeric,
  accumulated_power_consumption numeric,
  accumulated_fuel_consumption numeric,
  accumulated_co2_emissions numeric,
  fuel_consumption numeric,
  last_fueling_date timestamptz,
  last_fueling_qty numeric,
  before_qty numeric,
  total_qty numeric,
  fueling_span_days numeric,
  next_fueling_plan text,
  site_label text,
  raw_payload jsonb not null,
  source_hash text not null,
  imported_at timestamptz not null default now()
);

create index if not exists energy_dashboard_area_idx on public.energy_dashboard(area);
create index if not exists energy_dashboard_status_idx on public.energy_dashboard(cow_status);
create index if not exists energy_dashboard_power_source_idx on public.energy_dashboard(power_source);
create index if not exists energy_dashboard_next_fueling_idx on public.energy_dashboard(next_fueling_plan);

alter table public.energy_dashboard enable row level security;
drop policy if exists "Authenticated users read energy dashboard" on public.energy_dashboard;
create policy "Authenticated users read energy dashboard"
  on public.energy_dashboard for select to authenticated using (true);

comment on table public.energy_dashboard is
  'Normalized, lossless copy of the CMDB Energy Dashboard Google Sheet worksheet.';
