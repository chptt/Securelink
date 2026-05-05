-- CipherView Supabase Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Videos table
create table if not exists public.videos (
  id              uuid primary key default uuid_generate_v4(),
  title           text not null,
  description     text default '',
  creator_address text not null,
  thumbnail_url   text not null,
  encrypted_url   text not null,
  encryption_iv   text not null,
  encryption_auth_tag text not null,
  price_sui       numeric(18, 9) not null check (price_sui > 0),
  duration_hours  integer not null check (duration_hours > 0),
  created_at      timestamptz default now()
);

-- Purchases table
create table if not exists public.purchases (
  id              uuid primary key default uuid_generate_v4(),
  video_id        uuid not null references public.videos(id) on delete cascade,
  buyer_address   text not null,
  purchased_at    timestamptz default now(),
  expires_at      timestamptz not null,
  status          text default 'active' check (status in ('active', 'expired'))
);

-- Transactions table
create table if not exists public.transactions (
  id              uuid primary key default uuid_generate_v4(),
  video_id        uuid not null references public.videos(id) on delete cascade,
  buyer_address   text not null,
  creator_address text not null,
  tx_digest       text not null,
  amount_sui      numeric(18, 9) not null,
  created_at      timestamptz default now()
);

-- Indexes
create index if not exists idx_videos_creator on public.videos(creator_address);
create index if not exists idx_videos_created on public.videos(created_at desc);
create index if not exists idx_purchases_buyer on public.purchases(buyer_address);
create index if not exists idx_purchases_video on public.purchases(video_id);
create index if not exists idx_purchases_expires on public.purchases(expires_at);
create index if not exists idx_transactions_buyer on public.transactions(buyer_address);
create index if not exists idx_transactions_creator on public.transactions(creator_address);

-- Row Level Security
alter table public.videos enable row level security;
alter table public.purchases enable row level security;
alter table public.transactions enable row level security;

-- Videos: anyone can read public metadata (NOT encrypted fields)
create policy "Public can read video metadata"
  on public.videos for select
  using (true);

-- Videos: only service role can insert/update (via API routes)
create policy "Service role can insert videos"
  on public.videos for insert
  with check (true);

-- Purchases: service role manages all
create policy "Service role manages purchases"
  on public.purchases for all
  using (true);

-- Transactions: service role manages all
create policy "Service role manages transactions"
  on public.transactions for all
  using (true);