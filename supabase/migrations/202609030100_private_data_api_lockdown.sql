-- Apply this migration after the application code that moves onboarding and
-- display lookups behind purpose-built server APIs has reached production.
--
-- The old anonymous SELECT policies were row filters, not column filters, and
-- could expose every column from an eligible row through the Data API.
drop policy if exists "Setup links can read pending customer records"
  on public.customers;
drop policy if exists "Displays can read active assigned devices"
  on public.devices;
drop policy if exists "Displays can read playlists for active devices"
  on public.playlists;

revoke all privileges on table public.customers from anon;
revoke all privileges on table public.devices from anon;
revoke all privileges on table public.playlists from anon;
