alter table public.landing_example_videos
  add column if not exists orientation text not null default 'landscape';

alter table public.landing_example_videos
  drop constraint if exists landing_example_videos_orientation_check;

alter table public.landing_example_videos
  add constraint landing_example_videos_orientation_check
  check (orientation in ('portrait', 'landscape'));
