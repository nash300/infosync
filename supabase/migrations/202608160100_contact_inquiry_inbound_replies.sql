alter table public.contact_inquiry_replies
  add column if not exists sender_role text not null default 'admin',
  add column if not exists sender_email text,
  add column if not exists inbound_email_id text,
  add column if not exists inbound_message_id text;

update public.contact_inquiry_replies
set sender_role = 'admin'
where sender_role is null;

alter table public.contact_inquiry_replies
  alter column email_status drop not null,
  drop constraint if exists contact_inquiry_replies_sender_role_check,
  add constraint contact_inquiry_replies_sender_role_check
    check (sender_role in ('visitor', 'admin')),
  drop constraint if exists contact_inquiry_replies_email_status_check,
  add constraint contact_inquiry_replies_email_status_check
    check (
      email_status is null
      or email_status in ('pending', 'sent', 'delivered', 'failed', 'bounced', 'complained')
    );

create unique index if not exists contact_inquiry_replies_inbound_email_idx
  on public.contact_inquiry_replies(inbound_email_id)
  where inbound_email_id is not null;
