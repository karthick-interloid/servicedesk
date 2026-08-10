-- ==========================================================
-- File: 09_sla_policies.sql
-- ==========================================================

create table if not exists public.sla_policies
(
    id uuid primary key
        default gen_random_uuid(),

    tenant_id uuid
        not null
        references public.tenants(id)
        on delete cascade,

    name text
        not null,

    first_response_mins integer
        not null,

    resolution_mins integer
        not null,

    priority_scope ticket_priority
        not null,

    business_hours_id uuid
        references public.business_hours(id),
    
    is_default boolean
        default true,
        
    created_at timestamptz
        default now(),

    updated_at timestamptz
        default now(),

    constraint uq_sla_priority
        unique
        (
            tenant_id,
            priority_scope
        )
);

