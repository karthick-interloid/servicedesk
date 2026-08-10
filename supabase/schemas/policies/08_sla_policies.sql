-- =====================================================
-- File: 002_rls_sla_policies.sql
-- Description: RLS Policies for SLA Policies
-- =====================================================

ALTER TABLE public.sla_policies ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SELECT
-- =====================================================

CREATE POLICY "sla_select"
ON public.sla_policies
FOR SELECT
TO authenticated
USING (
    tenant_id = (auth.jwt()->>'tenant_id')::uuid
);

-- =====================================================
-- INSERT
-- =====================================================

CREATE POLICY "sla_insert"
ON public.sla_policies
FOR INSERT
TO authenticated
WITH CHECK (
    tenant_id = (auth.jwt()->>'tenant_id')::uuid
    AND
    (auth.jwt()->>'tenant_role') IN ('tenant_admin', 'manager')
);

-- =====================================================
-- UPDATE
-- =====================================================

CREATE POLICY "sla_update"
ON public.sla_policies
FOR UPDATE
TO authenticated
USING (
    tenant_id = (auth.jwt()->>'tenant_id')::uuid
    AND
    (auth.jwt()->>'tenant_role') IN ('tenant_admin', 'manager')
)
WITH CHECK (
    tenant_id = (auth.jwt()->>'tenant_id')::uuid
    AND
    (auth.jwt()->>'tenant_role') IN ('tenant_admin', 'manager')
);

-- =====================================================
-- DELETE
-- =====================================================

CREATE POLICY "sla_delete"
ON public.sla_policies
FOR DELETE
TO authenticated
USING (
    tenant_id = (auth.jwt()->>'tenant_id')::uuid
    AND
    (auth.jwt()->>'tenant_role') = 'tenant_admin'
);