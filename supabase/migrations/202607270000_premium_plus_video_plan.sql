insert into public.pricing_plans (
  code,
  name,
  resolution,
  setup_fee_sek,
  setup_included_screens,
  additional_setup_fee_sek,
  hardware_fee_sek,
  shipping_fee_sek,
  shipping_included_devices,
  additional_shipping_fee_sek,
  monthly_fee_sek,
  trial_days,
  currency,
  tax_behavior,
  is_active
)
values (
  'premium_plus_4k',
  'Premium Plus',
  '4K',
  1599,
  3,
  249,
  1099,
  99,
  3,
  29,
  399,
  21,
  'sek',
  'inclusive',
  true
)
on conflict (code) do update set
  name = excluded.name,
  resolution = excluded.resolution,
  setup_fee_sek = excluded.setup_fee_sek,
  setup_included_screens = excluded.setup_included_screens,
  additional_setup_fee_sek = excluded.additional_setup_fee_sek,
  hardware_fee_sek = excluded.hardware_fee_sek,
  shipping_fee_sek = excluded.shipping_fee_sek,
  shipping_included_devices = excluded.shipping_included_devices,
  additional_shipping_fee_sek = excluded.additional_shipping_fee_sek,
  monthly_fee_sek = excluded.monthly_fee_sek,
  trial_days = excluded.trial_days,
  currency = excluded.currency,
  tax_behavior = excluded.tax_behavior,
  is_active = excluded.is_active,
  updated_at = now();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'customer-display-assets',
  'customer-display-assets',
  false,
  104857600,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'application/pdf',
    'video/mp4',
    'video/webm'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.customer_display_assets
  drop constraint if exists customer_display_assets_asset_category_check;

alter table public.customer_display_assets
  add constraint customer_display_assets_asset_category_check
  check (asset_category in ('logo', 'image', 'menu', 'text', 'video', 'other'));

comment on table public.pricing_plans is
  'Screenia pricing plans, including Premium Plus 4K with customer video uploads.';
