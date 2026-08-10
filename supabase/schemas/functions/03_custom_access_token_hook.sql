-- ==========================================================
-- File: 03_custom_access_token_hook.sql
-- Description: Add tenant_id and tenant_role to JWT
-- ==========================================================

------------------------------------------------------------
-- Create Access Token Hook
------------------------------------------------------------

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
    claims jsonb;
    v_tenant_id uuid;
    v_tenant_role text;
begin
    --------------------------------------------------------
    -- Existing JWT claims
    --------------------------------------------------------

    claims := event->'claims';

    --------------------------------------------------------
    -- Get user's active membership
    --------------------------------------------------------

    select
        m.tenant_id,
        m.role::text
    into
        v_tenant_id,
        v_tenant_role
    from public.memberships m
    where m.user_id = (event->>'user_id')::uuid
    limit 1;

    --------------------------------------------------------
    -- Add tenant_id claim
    --------------------------------------------------------

    claims := jsonb_set(
        claims,
        '{tenant_id}',
        to_jsonb(v_tenant_id),
        true
    );

    --------------------------------------------------------
    -- Add tenant_role claim
    --------------------------------------------------------

    claims := jsonb_set(
        claims,
        '{tenant_role}',
        to_jsonb(v_tenant_role),
        true
    );

    --------------------------------------------------------
    -- Update event claims
    --------------------------------------------------------

    event := jsonb_set(
        event,
        '{claims}',
        claims,
        true
    );

    return event;
end;
$$;

------------------------------------------------------------
-- Permissions
------------------------------------------------------------

grant execute
on function public.custom_access_token_hook(jsonb)
to supabase_auth_admin;

revoke execute
on function public.custom_access_token_hook(jsonb)
from authenticated, anon, public;