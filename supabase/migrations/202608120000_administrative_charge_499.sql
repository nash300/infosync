-- Change the base administrative/setup charge for new quotes without rewriting
-- the price snapshots stored on existing customer orders.
update public.pricing_plans
set
  setup_fee_sek = 499,
  stripe_setup_price_id = null,
  updated_at = now()
where code in ('standard_fhd', 'premium_4k', 'premium_plus_4k')
  and setup_fee_sek is distinct from 499;

alter table public.customer_subscriptions
  add column if not exists setup_fee_waived boolean not null default false,
  add column if not exists setup_fee_waiver_reason text;

alter table public.customer_subscriptions
  drop constraint if exists customer_subscriptions_setup_fee_waiver_check,
  add constraint customer_subscriptions_setup_fee_waiver_check
    check (
      not setup_fee_waived
      or (
        coalesce(base_setup_fee_sek, 0) = 0
        and setup_fee_waiver_reason is not null
        and length(trim(setup_fee_waiver_reason)) >= 3
      )
    );

comment on column public.customer_subscriptions.setup_fee_waived is
  'True when an admin waived the base 499 SEK administrative/setup charge for this new-client quote. Extra-screen setup charges can still apply.';
comment on column public.customer_subscriptions.setup_fee_waiver_reason is
  'Required audit reason for a selected new-client base setup-fee waiver.';
