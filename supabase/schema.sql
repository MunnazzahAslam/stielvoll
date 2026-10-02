-- Stielvoll orders. Run once in the Supabase SQL editor (or with `supabase db push`).
-- The app talks to this table only from the server, with the service role key,
-- so row level security is on and no policies are granted to the public roles.

create extension if not exists pgcrypto;

create sequence if not exists order_number_seq start 1042;

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique default ('ST-' || nextval('order_number_seq')),
  status text not null default 'new'
    check (status in ('new', 'preparing', 'ready', 'out_for_delivery', 'done')),
  fulfilment text not null check (fulfilment in ('pickup', 'delivery')),
  slot_start timestamptz not null,
  name text not null,
  email text not null,
  phone text not null,
  address text,
  postcode text,
  items jsonb not null,
  subtotal_cents integer not null check (subtotal_cents >= 0),
  delivery_cents integer not null default 0 check (delivery_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  stripe_session_id text unique,
  paid boolean not null default false,
  created_at timestamptz not null default now(),
  constraint delivery_has_address check (fulfilment = 'pickup' or (address is not null and postcode is not null))
);

create index if not exists orders_slot_start_idx on orders (slot_start);

alter table orders enable row level security;
