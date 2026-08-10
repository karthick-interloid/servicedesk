ALTER TABLE public.saved_views ENABLE ROW LEVEL SECURITY;

-- SELECT
CREATE POLICY "Members can view tenant Saved View"
ON public.saved_views
FOR SELECT
TO authenticated
USING (
    tenant_id = (auth.jwt()->>'tenant_id')::uuid
    AND public.is_active_membership()
);

-- INSERT
CREATE POLICY "Members can create tenant Saved View"
ON public.saved_views
FOR INSERT
TO authenticated
WITH CHECK (
    tenant_id = (auth.jwt()->>'tenant_id')::uuid
    AND public.is_active_membership()
);

-- UPDATE
CREATE POLICY "Members can update tenant Saved View"
ON public.saved_views
FOR UPDATE
TO authenticated
USING (
    tenant_id = (auth.jwt()->>'tenant_id')::uuid
    AND public.is_active_membership()
)
WITH CHECK (
    tenant_id = (auth.jwt()->>'tenant_id')::uuid
    AND public.is_active_membership()
);

-- DELETE
CREATE POLICY "Members can delete tenant Saved View"
ON public.saved_views
FOR DELETE
TO authenticated
USING (
    tenant_id = (auth.jwt()->>'tenant_id')::uuid
    AND public.is_active_membership()
);