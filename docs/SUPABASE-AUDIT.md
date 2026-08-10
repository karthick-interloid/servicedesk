# Supabase Schema Audit

**Scope:** `supabase/` — static audit, pre-initial-migration
**Date:** 2026-08-08
**Branch:** `feature/authentication`
**State:** No migration has been generated or pushed. `supabase/migrations/` is empty.

This is a **static** audit — every finding below was verified by reading the SQL and
`config.toml` on disk. No database was queried and no files were modified.

---

## Status Summary

|                           | Count  |
| ------------------------- | ------ |
| ✅ Fixed since first pass | 4      |
| 🟡 Partially fixed        | 1      |
| 🔴 Still open             | 29     |
| ⚠️ New regression         | 1      |
| **Total tracked**         | **34** |

### Fixed since the first pass

| ID    | Item                                                           | Evidence                                                                                                                                                                                               |
| ----- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| P1-4  | `custom_access_token_hook` is now **enabled**                  | `config.toml:290-292` — `uri = "pg-functions://postgres/public/custom_access_token_hook"`, correct format                                                                                              |
| P1-7  | Invalid role literal `'admin'` → `'tenant_admin'`              | `policies/06_customers.sql` — all 4 sites corrected                                                                                                                                                    |
| P2-10 | Billing tables now gated to `tenant_admin` / `billing_admin`   | `policies/05_subscriptions.sql`, `policies/18_invoices.sql` — also renamed to snake_case, fixed the `"Invioce"` typo, and switched from raw `auth.jwt()->>'tenant_id'` to `public.current_tenant_id()` |
| P2-11 | Duplicate, `anon`-exposed policies removed from the table file | `tables/04_users.sql` — now pure DDL, no `CREATE POLICY`                                                                                                                                               |

### Partially fixed

| ID   | Item               | Done                                                            | Still missing                                                                       |
| ---- | ------------------ | --------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| P1-6 | Storage SQL wiring | `schemas/storage/buckets.sql` added to `[db.seed] sql_paths` ✅ | `schemas/policies/storage/*.sql` (4 files) still match **no** path — see P1-6 below |

---

## ⚠️ REGRESSION — introduced by the P2-11 fix

Removing the policies from `tables/04_users.sql` was structurally correct, but one of
them — `"Authenticated users can insert themselves"` (`auth.uid() = id`) — was the only
thing making `public.users` writable, because it OR'd with the broken policy set in
`policies/03_users.sql`.

**`public.users` now has zero functioning policies.** All four in `policies/03_users.sql`
reference a column that does not exist, so the table will be completely inaccessible the
moment the schema applies (assuming it applies at all — see P0-1).

Fix P0-1 and P1-5 together; do not re-add the policy to the table file.

---

# P0 — Migration will not apply

Nothing else can be tested until `supabase db push` succeeds.

### P0-1 · `policies/03_users.sql` references a non-existent column

**Status:** 🔴 Open · **Impact:** Hard failure

All four policies filter on `tenant_id`:

| Line   | Policy         |
| ------ | -------------- |
| 14     | `users_select` |
| 23     | `users_insert` |
| 33, 36 | `users_update` |
| 45     | `users_delete` |

`tables/04_users.sql` defines only `id, email, full_name, avatar_url, created_at, updated_at`.

```
ERROR: column "tenant_id" does not exist
```

**Design note:** `users` is deliberately global (1:1 with `auth.users`) and tenancy lives in
`memberships`. So the fix is _not_ to add `tenant_id` to `users` — it's to rewrite the
policies to scope via `memberships`, or to scope on `auth.uid() = id` for self-access.
Pick one and be consistent; this decision also resolves P1-5 and the regression above.

### P0-2 · `current_role()` called unqualified

**Status:** 🔴 Open · **Impact:** Syntax error

`policies/09_tickets.sql` lines **19, 41, 63, 87**.

`CURRENT_ROLE` is a **fully-reserved** PostgreSQL keyword (unlike `CURRENT_SCHEMA`, which is
"reserved, can be function or type name"). The parser reduces `current_role` to the
`SQLValueFunction` node and then hits `(` unexpectedly:

```
ERROR: syntax error at or near "("
```

The function is _creatable_ as `public.current_role()` because the qualified form parses the
second identifier as a `ColLabel`, which admits all keywords — but it can **never** be called
unqualified, in any file, ever.

The other 15 policy files already write `public.current_role()`. Only tickets does not.

> **Recommendation:** rename the function to `public.current_tenant_role()` in
> `functions/01_current_tenant_id.sql:14`. Shadowing a reserved word is a permanent trap —
> renaming removes the whole class of error rather than patching four call sites.

### P0-3 · Trigger created before its function exists

**Status:** 🔴 Open · **Impact:** Hard failure

`tables/16_sla_events.sql:43` ends with:

```sql
CREATE TRIGGER trg_sla_events_updated_at
BEFORE UPDATE ON public.sla_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
```

But `config.toml:62-70` loads `tables/*` **before** `functions/*`:

```
extensions → types → tables → functions → indexes → triggers → policies
```

```
ERROR: function public.update_updated_at_column() does not exist
```

**Fix:** move the trigger to `schemas/triggers/`. Do this as part of P3-14, which has to
create ~14 more of these anyway.

---

# P1 — Applies, but the app does not work

### P1-5 · Signup bootstrap deadlock

**Status:** 🔴 Open · **Impact:** Tenant creation is impossible

`policies/02_tenants.sql` — `tenants_insert` requires `public.current_role() = 'tenant_admin'`.
`policies/04_memberships.sql` — `memberships_insert` requires an existing `tenant_admin` / `manager`.

A newly signed-up user has **no membership**, therefore no `tenant_role` claim, therefore
cannot create the tenant that would grant them the role. Circular.

Directly blocks the tenant-creation screen on this branch.

**Options:** a `SECURITY DEFINER` RPC (`create_tenant_with_owner`) that creates tenant +
membership atomically and is the only write path, or a bootstrap carve-out in the policy
allowing insert when the user has zero memberships. The RPC is the safer of the two.

### P1-6 · Storage RLS policies match no configured path

**Status:** 🟡 Partial · **Impact:** `storage.objects` has zero project policies

`config.toml:70` uses `"./schemas/policies/*.sql"` — a **non-recursive** glob. It matches
20 files; 24 exist. These 4 never execute:

- `policies/storage/avatars.sql`
- `policies/storage/customer_files.sql`
- `policies/storage/invoices.sql`
- `policies/storage/ticket_attachments.sql`

✅ `schemas/storage/buckets.sql` was correctly moved into `[db.seed] sql_paths` — right call,
since it's `INSERT` (DML) and could not live in `schema_paths` regardless.

**Fix:** add `"./schemas/policies/storage/*.sql"` as an explicit eighth entry in `schema_paths`.

### P1-8 · Customer-portal role path is unresolved

**Status:** 🔴 Open · **Impact:** Portal customers can see nothing

`policies/09_tickets.sql`, `policies/10_ticket_messages.sql`, and
`policies/storage/ticket_attachments.sql` all branch on `public.current_role() = 'customer'`.

That claim is produced by `custom_access_token_hook` from `memberships`, which FKs to
`public.users`. Nothing creates a `users` row + `memberships` row for a
`customers.portal_user_id`. As written, a portal customer authenticates successfully and
then receives a null `tenant_id` claim and matches no policy.

**Decide:** either portal customers get a `memberships` row with `role = 'customer'`, or the
hook derives the claim from `customers.portal_user_id` directly. The second avoids polluting
`memberships` with non-staff, but means the hook does two lookups.

---

# P2 — Security

### P2-9 · Per-user tables have no per-user scoping

**Status:** 🔴 Open · **Impact:** Cross-user data exposure within a tenant

| File                                 | Table                |
| ------------------------------------ | -------------------- |
| `policies/15_saved_views.sql`        | `saved_views`        |
| `policies/16_notification_prefs.sql` | `notification_prefs` |
| `policies/17_notifications.sql`      | `notifications`      |

All three gate only on `tenant_id` + `is_active_membership()`. Verified: **zero** occurrences
of `user_id = auth.uid()` or `owner_user_id = auth.uid()` across the three files.

Any tenant member can read, update, and **delete** any colleague's notifications, notification
preferences, and private saved views. `saved_views.is_shared` exists but is never referenced
in a policy.

### P2-12 · Access-token hook picks a membership non-deterministically

**Status:** 🔴 Open · **Impact:** Wrong-tenant claims

`functions/03_custom_access_token_hook.sql:40` — `limit 1` with no `ORDER BY` and no
`status = 'active'` filter.

- A user in two tenants lands in an arbitrary one, and it can change between refreshes.
- `invited` and `disabled` members still receive a full `tenant_id` + `tenant_role` claim.

Also: no handling for the zero-membership case — `to_jsonb(NULL::uuid)` writes a JSON `null`
claim rather than omitting the key.

### P2-13 · Function and extension hardening

**Status:** 🔴 Open · **Impact:** Supabase security advisors will flag both

**a. Missing `SET search_path`** — 5 functions across 4 files
(`function_search_path_mutable`):

- `functions/01_current_tenant_id.sql` — `current_tenant_id()`, `current_role()`
- `functions/07_update_updated_at_column.sql`
- `functions/generate_ticket_number.sql`
- `functions/05_sla_breach_check.sql`

`03_custom_access_token_hook.sql`, `02_current_customer_id.sql`, and `06_tenant_check_helper.sql`
already set it correctly.

**b. Extensions installed into `public`** — `extensions/extensions.sql:6-11` uses bare
`create extension if not exists …` with no `with schema extensions`. All six land in `public`.

---

# P3 — Correctness & missing automation

### P3-14 · `updated_at` is stale on 14 of 16 tables

**Status:** 🔴 Open

Only two triggers exist: `triggers/tenants_updated_at.sql` and the misplaced one in
`tables/16_sla_events.sql` (P0-3).

Missing on: `users`, `tickets`, `customers`, `memberships`, `plans`, `timezones`, `tags`,
`business_hours`, `sla_policies`, `subscriptions`, `notification_prefs`, `saved_views`,
`attachments`, `ticket_messages`.

### P3-15 · No `handle_new_user` trigger

**Status:** 🔴 Open

Nothing bridges `auth.users` → `public.users`. Verified: no match for `handle_new_user`
anywhere in `schemas/`. Profile rows are never created on signup.

### P3-16 · `generate_ticket_number()` is never called

**Status:** 🔴 Open

Verified: the only reference is its own definition. `tickets.number` is `not null` with no
default, so every insert must compute and supply it — and the advisory-lock logic in the
function is bypassed entirely.

### P3-17 · No cross-tenant integrity constraints

**Status:** 🔴 Open

`ticket_tags.tenant_id` can disagree with `tickets.tenant_id`. Same exposure in
`attachments`, `ticket_messages`, and `sla_events` — each carries a denormalised `tenant_id`
with nothing binding it to the parent's.

**Fix:** add `UNIQUE (id, tenant_id)` on parents and composite FKs `(ticket_id, tenant_id)`
on children.

### P3-18 · `process_sla_breaches()` is never scheduled

**Status:** 🔴 Open

No `pg_cron` in `extensions/extensions.sql`, no `cron.schedule` call anywhere, and
`supabase/functions/` (edge) is empty. SLA breach detection is dead code.

### P3-19 · `audit_logs` has no INSERT policy

**Status:** 🔴 Open · Confirm intent

Verified: exactly 1 `CREATE POLICY` in `policies/19_audit_logs.sql` (SELECT only). With RLS
enabled, only the service role can write audit rows. Defensible if all audit writes go
through a trusted server path — but the other 19 policy files define full CRUD, so flagging
the asymmetry.

### P3-20 · `is_active_membership()` re-checks role against the JWT

**Status:** 🔴 Open

`functions/06_tenant_check_helper.sql` asserts `m.role::text = auth.jwt()->>'tenant_role'`.
Any user whose role changes is hard-denied until their token refreshes (up to
`jwt_expiry = 3600`, one hour).

### P3-21 · Inconsistent `ON DELETE` behaviour

**Status:** 🔴 Open

| Blocks deletion (no clause)      | Uses `SET NULL`            |
| -------------------------------- | -------------------------- |
| `tickets.requester_customer_id`  | `audit_logs.actor_id`      |
| `tickets.assignee_user_id`       | `customers.portal_user_id` |
| `sla_policies.business_hours_id` | `attachments.uploaded_by`  |

### P3-22 · `sla_policies.is_default` defaults to `true`

**Status:** 🔴 Open

`tables/06_sla_policies.sql:30-31`. Every policy created is "default". Combined with
`unique (tenant_id, priority_scope)` — which already caps it at one policy per priority per
tenant — the column carries no information.

---

# P4 — Hygiene & consistency

| ID    | Item                                                                                                                                                                                                                                                      | File                                                    |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| P4-23 | Seeds are not idempotent — verified **0** `ON CONFLICT` clauses in either seed. Re-seeding errors out. `buckets.sql` does it correctly; match that                                                                                                        | `seeds/01_plans_seed.sql`, `seeds/02_timezone_seed.sql` |
| P4-24 | `plans.code` comment says `'FREE, PRO, BUSINESS'` but the seed inserts PayPal plan IDs — and the Free row's `F-15e70eec-…` isn't a PayPal ID either. `code` is silently doubling as a billing identifier alongside `subscriptions.paypal_subscription_id` | `tables/01_plans.sql`, `seeds/01_plans_seed.sql`        |
| P4-25 | Plan seed omits `description`, `storage_limit_mb`, `sort_order` → all three plans get `sort_order = 0`, so pricing-page order is non-deterministic                                                                                                        | `seeds/01_plans_seed.sql`                               |
| P4-26 | `additional_redirect_urls = ["https://127.0.0.1:3000"]` — `https` against an `http` dev server with `[api.tls] enabled = false`. No `localhost` variant, no `/auth/callback` path. Will break OAuth and magic-link redirects                              | `config.toml`                                           |
| P4-27 | Duplicate file prefixes in `tables/`: `03_tenants`/`03_timezones` and `05_business_hours`/`05_customers`/`05_memberships`. Dependency order currently resolves by luck of alphabetical sort (`b < c < m`); renaming any file breaks it. No `01_` exists   | `tables/`                                               |
| P4-28 | Only `policies/14_sla_events.sql` carries `DROP POLICY IF EXISTS` guards. The other 19 are bare `CREATE POLICY` and are not re-runnable                                                                                                                   | `policies/`                                             |
| P4-29 | Timestamp nullability inconsistent — `business_hours`, `sla_policies`, `subscriptions`, `invoices`, `notification_prefs`, `saved_views` use bare `default now()` vs `not null default now()` elsewhere                                                    | `tables/`                                               |
| P4-30 | `schemas/indexes/` is empty but listed in `schema_paths`; all indexes are declared inline in table files. Layout and practice disagree                                                                                                                    | `schemas/indexes/`                                      |
| P4-31 | `supabase/seed.sql` is empty and referenced by nothing (`sql_paths` points only at `schemas/`). Dead file                                                                                                                                                 | `supabase/seed.sql`                                     |
| P4-32 | `pgcrypto` and `uuid-ossp` are both redundant — `gen_random_uuid()` is built into PG 13+ (this is PG 17) and nothing calls `uuid_generate_v4()`                                                                                                           | `extensions/extensions.sql`                             |
| P4-33 | `minimum_password_length = 6`, `password_requirements = ""` — verify against what the signup form validates                                                                                                                                               | `config.toml`                                           |
| P4-34 | `[auth.email] enable_confirmations = false` — signups auto-confirm locally, diverging from hosted behaviour                                                                                                                                               | `config.toml`                                           |

---

## Recommended fix order

Findings cluster by file, so this is far fewer passes than 30 items suggests.

### Batch 1 — Unblock the migration

`P0-1` · `P0-2` · `P0-3` · `P4-27`

Rename `current_role()` → `current_tenant_role()` while touching
`functions/01_current_tenant_id.sql`, and renumber the `tables/` prefixes in the same pass
since you're moving the `sla_events` trigger out anyway.

### Batch 2 — Make auth work end-to-end

`P1-5` · `P1-6` · `P1-8` · `P2-12`

P1-5 and P1-8 are the same architectural decision (how a principal acquires a tenant claim),
so resolve them together. P1-6 is a one-line `config.toml` edit. P2-12 lands in the hook,
which P1-8 is already rewriting.

### Batch 3 — Close the security gaps

`P2-9` · `P2-13`

### Batch 4 — Triggers and integrity

`P3-14` · `P3-15` · `P3-16` · `P3-17` · `P3-18` · `P3-19` · `P3-20` · `P3-21` · `P3-22`

Mostly new files under `schemas/triggers/`.

### Batch 5 — Sweep

All of P4.

**Only Batches 1 and 2 gate your first `db push`.**

---

## Verification method

- Every finding re-checked against on-disk state on 2026-08-08.
- Column existence, policy counts, glob matches, trigger counts, and `ON CONFLICT` counts
  were confirmed by direct inspection rather than inferred.
- No database connection was made; no remote state is reflected here.
- Load order claims derive from the `schema_paths` array in `config.toml:62-70` combined with
  lexicographic glob expansion.
