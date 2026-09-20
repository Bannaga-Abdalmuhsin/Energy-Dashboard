# stc COW Energy Management Platform

A responsive operations website for **Energy Consumption & CO₂ Emissions Tracking and Fuel Management** across the national COW portfolio.

## Included

- Secure login with Supabase Auth support and a preview fallback before configuration
- National command-center overview with energy, diesel, emissions, coverage and alerts
- Dedicated Energy Analytics, CO₂ Emissions, Fuel Management, Sites & Map, Reports and Settings routes
- Responsive desktop/mobile application shell with protected routes
- Supabase REST adapter, environment template, relational schema and row-level security starter policies
- Existing Google Sheet analytics functions retained for migration/reference

## Run locally

```bash
pnpm install
pnpm dev
```

Until Supabase is configured, the login is in preview mode and accepts any valid email/password combination.

## Connect Supabase

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL Editor.
3. Copy `.env.example` to `.env.local` and set:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

4. Create users in Supabase Authentication and optionally add `full_name` and `role` to user metadata.
5. Import site, energy, emissions, fuel and alerts data into the matching tables.

Never commit the Supabase service-role key. The browser application needs only the public anon key; RLS controls access.

## Data model

| Table | Purpose |
|---|---|
| `sites` | COW master data, location, source and capacities |
| `energy_readings` | Timestamped power and energy measurements |
| `fuel_transactions` | Deliveries, consumption, levels and supplier details |
| `emission_readings` | Scope 1/2 and avoided emissions |
| `alerts` | Operational energy and fuel alerts |
| `profiles` | User role and region access metadata |

## Validation

```bash
pnpm typecheck
pnpm test
pnpm build
```
