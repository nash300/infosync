create table if not exists public.landing_example_videos (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 140),
  body text not null default '' check (char_length(body) <= 500),
  video_url text not null,
  storage_path text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists landing_example_videos_active_order_idx
  on public.landing_example_videos (is_active, sort_order, created_at);

alter table public.landing_example_videos enable row level security;

drop policy if exists "Public can read active landing example videos"
  on public.landing_example_videos;
create policy "Public can read active landing example videos"
  on public.landing_example_videos
  for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "Admins can manage landing example videos"
  on public.landing_example_videos;
create policy "Admins can manage landing example videos"
  on public.landing_example_videos
  for all
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'landing-media',
  'landing-media',
  true,
  104857600,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop trigger if exists set_updated_at on public.landing_example_videos;
create trigger set_updated_at
  before update on public.landing_example_videos
  for each row execute function public.set_updated_at();
