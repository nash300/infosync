alter table public.landing_example_videos
  add column if not exists poster_url text;

alter table public.landing_example_videos
  add column if not exists poster_storage_path text;
