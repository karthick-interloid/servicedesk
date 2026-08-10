-- =====================================================
-- File: 01_current_tenant_id.sql
-- Description: Helper functions for RLS
-- =====================================================

CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
SELECT (auth.jwt()->>'tenant_id')::uuid;
$$;

CREATE OR REPLACE FUNCTION public.current_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
SELECT auth.jwt()->>'tenant_role';
$$;


