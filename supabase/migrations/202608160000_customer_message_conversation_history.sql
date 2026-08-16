alter table public.customer_messages
  add column if not exists sender_role text not null default 'customer',
  add column if not exists sender_user_id uuid references auth.users(id) on delete set null,
  add column if not exists reply_to_message_id uuid references public.customer_messages(id) on delete set null,
  add column if not exists email_id text,
  add column if not exists email_status text not null default 'not_applicable';

update public.customer_messages
set
  sender_role = 'admin',
  email_status = case
    when email_status = 'not_applicable' then 'unknown'
    else email_status
  end
where subject ilike '%reply from screenia%';

alter table public.customer_messages
  drop constraint if exists customer_messages_sender_role_check,
  add constraint customer_messages_sender_role_check
    check (sender_role in ('customer', 'admin')),
  drop constraint if exists customer_messages_email_status_check,
  add constraint customer_messages_email_status_check
    check (
      email_status in (
        'not_applicable',
        'unknown',
        'pending',
        'sent',
        'delivered',
        'failed',
        'bounced',
        'complained'
      )
    );

create index if not exists customer_messages_thread_created_idx
  on public.customer_messages(customer_id, ticket_number, created_at asc)
  where ticket_number is not null;

create unique index if not exists customer_messages_email_id_idx
  on public.customer_messages(email_id)
  where email_id is not null;

alter table public.contact_inquiries
  drop constraint if exists contact_inquiries_confirmation_status_check,
  add constraint contact_inquiries_confirmation_status_check
    check (confirmation_email_status in ('pending', 'sent', 'delivered', 'failed', 'bounced', 'complained')),
  drop constraint if exists contact_inquiries_admin_email_status_check,
  add constraint contact_inquiries_admin_email_status_check
    check (admin_notification_email_status in ('pending', 'sent', 'delivered', 'failed', 'bounced', 'complained'));

alter table public.contact_inquiry_replies
  drop constraint if exists contact_inquiry_replies_email_status_check,
  add constraint contact_inquiry_replies_email_status_check
    check (email_status in ('pending', 'sent', 'delivered', 'failed', 'bounced', 'complained'));
