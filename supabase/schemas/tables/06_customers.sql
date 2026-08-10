-- ==========================================================
-- File: 06_customers.sql
-- Description: Customer Portal Users
-- ==========================================================

create table if not exists public.customers
(
    id uuid primary key
        default gen_random_uuid(),

    tenant_id uuid
        not null
        references public.tenants(id)
        on delete cascade,

    email citext
        not null,

    full_name text
        not null,

    portal_user_id uuid
        references auth.users(id)
        on delete set null,

    phone text,

    created_at timestamptz
        not null
        default now(),

    updated_at timestamptz
        not null
        default now(),

    constraint uq_customer_email
        unique (tenant_id, email)
);

comment on table public.customers is
'Customers belonging to a tenant';

------------------------------------------------------------
-- Indexes
------------------------------------------------------------

create index if not exists idx_customer_tenant
on public.customers(tenant_id);

create index if not exists idx_customer_email
on public.customers(email);

create index if not exists idx_customer_portal
on public.customers(portal_user_id);
