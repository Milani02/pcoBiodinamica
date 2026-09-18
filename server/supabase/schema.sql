-- Controle de Gastos de TI (Biodinamica) - schema Supabase
-- Rode este arquivo inteiro no SQL Editor do projeto Supabase (uma vez).

-- ============================================================
-- profiles: dados de app ligados a um usuario do Supabase Auth
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  name text not null,
  role text not null check (role in ('diretoria', 'admin_ti')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

-- Nenhuma policy de insert/update/delete: apenas a service_role key
-- (usada pelo server) grava nessa tabela, e ela ignora RLS.

-- ============================================================
-- subscriptions: assinaturas/custos de TI
-- ============================================================
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  subject text not null,
  billing_cycle text not null check (billing_cycle in ('mensal', 'anual', 'sob_demanda')),
  amount numeric,
  currency text not null default 'BRL' check (currency in ('BRL', 'USD', 'EUR')),
  payment_method text not null check (payment_method in ('cartao_credito', 'boleto', 'pix', 'outro')),
  recurrence_type text not null check (recurrence_type in ('monthly_day', 'fixed_date', 'on_demand')),
  recurrence_day int check (recurrence_day between 1 and 31),
  recurrence_date date,
  billing_url text not null default '',
  access_url text not null default '',
  notes text not null default '',
  last_paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Migracao para bancos ja criados antes do campo last_paid_at existir:
alter table public.subscriptions add column if not exists last_paid_at timestamptz;

alter table public.subscriptions enable row level security;

drop policy if exists "subscriptions_select_authenticated" on public.subscriptions;
create policy "subscriptions_select_authenticated"
  on public.subscriptions for select
  to authenticated
  using (true);

drop policy if exists "subscriptions_write_admin_ti" on public.subscriptions;
create policy "subscriptions_write_admin_ti"
  on public.subscriptions for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin_ti'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin_ti'
    )
  );

-- ============================================================
-- subscription_payments: historico de "marcar como pago" das assinaturas
-- ============================================================
create table if not exists public.subscription_payments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  paid_at timestamptz not null default now(),
  paid_by uuid references public.profiles(id) on delete set null,
  paid_by_name text not null,
  amount numeric,
  currency text not null default 'BRL',
  created_at timestamptz not null default now()
);

alter table public.subscription_payments enable row level security;

drop policy if exists "subscription_payments_select_authenticated" on public.subscription_payments;
create policy "subscription_payments_select_authenticated"
  on public.subscription_payments for select
  to authenticated
  using (true);

-- Nenhuma policy de insert: quem pode marcar como pago (admin_ti e
-- diretoria) e decidido no backend (Express), que grava com a
-- service_role key e ignora RLS.

create index if not exists subscription_payments_subscription_id_idx
  on public.subscription_payments (subscription_id, paid_at desc);
