# Landing `current_role` → `current_tenant_role`

**Branch:** `feature/authentication` · **Date:** 2026-08-11
**Outcome:** 🛑 **STOPPED — the migration cannot be generated safely by the tooling.**
Nothing pushed. No remote touched.

---

## Result in one line

The diff was generated across both schemas exactly as specified, and it is **unsafe**: it
contains `DROP FUNCTION public."current_role"()` but **zero** `storage.objects` policies. The
local `db reset` proved this is not theoretical — it failed on that statement, naming all
11 dependent storage policies.

---

## Environment note

Docker Desktop's daemon (`~/.docker/desktop/docker.sock`, the active `desktop-linux` context)
was not running. The **system** daemon was active and your user is in the `docker` group, so
every command below ran with `DOCKER_HOST=unix:///var/run/docker.sock` exported for that
command only. Your docker context was **not** changed — nothing persists to other terminals.

## Baseline established first

`supabase start`, then `supabase db reset` against the four existing migrations:

```
Applying migration 20260810045832_initial_schema.sql...
Applying migration 20260810053816_add_storage_policies.sql...
Applying migration 20260810210000_add_customer_company.sql...
Applying migration 20260810210100_add_ticket_triggers.sql...
Finished supabase db reset
```

Clean. This independently re-confirms the Batch 1 finding that the declarative source was
never hard-blocked.

Baseline state, read from `pg_policies` / `pg_proc`:

| Fact                                     |  Value |
| ---------------------------------------- | -----: |
| `public.current_role()` exists           |    yes |
| `public.current_tenant_role()` exists    |     no |
| Policies referencing it in **`public`**  | **39** |
| Policies referencing it in **`storage`** | **11** |

Note the reconciliation with Batch 1: **70 call sites live in 50 policies** — a single policy
carries several calls (a `USING` and a `WITH CHECK`, or several arms of an `IN` list). The 16
storage _call sites_ are 11 storage _policies_.

## 1 · The command used

```
supabase db diff --schema public,storage -f rename_current_role_to_current_tenant_role
```

It ran, reported `"schemas":["public","storage"]` and `"engine":"pg-delta"`, and wrote
`supabase/migrations/20260811105440_rename_current_role_to_current_tenant_role.sql`.

## 2 · Inspection — the file is unsafe

| Check                                          | Found | Expected |
| ---------------------------------------------- | ----: | -------: |
| `DROP POLICY` (all `public.*`)                 |    39 |       39 |
| `CREATE POLICY` (all `public.*`)               |    39 |       39 |
| **Any `storage.` mention at all**              | **0** |   **11** |
| `DROP FUNCTION public."current_role"()`        |     1 |        1 |
| `CREATE FUNCTION public.current_tenant_role()` |     1 |        1 |
| `COMMENT ON COLUMN`                            |     1 |  (known) |

### Ordering — correct for `public`, fatal for `storage`

```
  1  SET check_function_bodies = false;
  2  COMMENT ON COLUMN public.customers.company IS NULL;
  3–41  DROP POLICY … (39, all public)
 42  DROP FUNCTION public."current_role"();        ← fails here
 43  CREATE FUNCTION public.current_tenant_role()  ← plain CREATE, not OR REPLACE
 50–106 CREATE POLICY … (39, all public)
```

The sequence itself is the right shape — drop dependants, drop function, create function,
recreate dependants — and it would be perfectly safe if `public` were the only schema
involved. It is not. The 11 `storage.objects` policies are never dropped and never recreated,
so they still hold a dependency on the old function when statement 42 runs.

### The known comment delta — present, and **not** harmless

Line 2 is `COMMENT ON COLUMN public.customers.company IS NULL;`. This is the delta predicted
in `BACKEND-BATCH1.md`, but note the direction: it **removes** the column comment that
`20260810210000_add_customer_company.sql` added, because the declarative source
(`tables/06_customers.sql`) declares the column without a `COMMENT`. It is unrelated to the
rename and should not ride along. The correct fix is in the **source** — add the matching
`COMMENT ON COLUMN` to `tables/06_customers.sql` and the delta disappears on regeneration.
Left undone here: out of scope for this pass, and it is your call.

No other unexpected delta. Every one of the 39 public policy re-creations is the original
expression with only the function name changed.

## 3 · Local `db reset` — failed, as predicted

```
Applying migration 20260811105440_rename_current_role_to_current_tenant_role.sql...
ERROR: cannot drop function "current_role"() because other objects depend on it (SQLSTATE 2BP01)
policy customer_files_select on table storage.objects depends on function "current_role"()
policy customer_files_insert on table storage.objects depends on function "current_role"()
policy customer_files_delete on table storage.objects depends on function "current_role"()
policy invoices_select on table storage.objects depends on function "current_role"()
policy invoices_insert on table storage.objects depends on function "current_role"()
policy invoices_update on table storage.objects depends on function "current_role"()
policy invoices_delete on table storage.objects depends on function "current_role"()
policy ticket_attachments_select on table storage.objects depends on function "current_role"()
policy ticket_attachments_insert on table storage.objects depends on function "current_role"()
policy ticket_attachments_update on table storage.objects depends on function "current_role"()
policy ticket_attachments_delete on table storage.objects depends on function "current_role"()
At statement: 41
DROP FUNCTION public."current_role"()
```

All 11, exactly the set counted at baseline. **This is a fail-closed error, not silent
breakage** — Postgres refuses the drop rather than orphaning storage RLS. Had the tooling
emitted `CASCADE`, the same migration would have silently deleted all 11 storage policies and
left the buckets wide open. It did not, and that is the one piece of luck here.

## Root cause — pg-delta will not diff `storage.objects` policies

Confirmed with an isolated storage-only diff against the clean baseline:

```
supabase db diff --schema storage
→ No schema changes found
```

This is with the declarative source already renamed and the database still on the old name —
a real difference that it reports as none. The CLI log shows it _does_ apply the declarative
files (`Seeding globals from customer_files.sql / invoices.sql / ticket_attachments.sql`), so
they reach the shadow database; pg-delta simply excludes `storage.objects` policies from
comparison. `storage.objects` is owned by `supabase_storage_admin`, not by the migration role.

This also retro-explains the repo's history: the storage policies were originally shipped as a
**separate, hand-written** migration (`20260810053816_add_storage_policies.sql`) rather than
appearing in the generated initial schema. The same limitation was hit then and worked around
the same way.

**Passing `--schema storage` does not help.** The flag is accepted and echoed back; the
exclusion is inside the engine.

## Why there is no clean generated-only path

The obvious split — a companion migration for storage, timestamped earlier — does not work:

- It would have to `CREATE` the new function before recreating the storage policies, and then
  the generated file's statement 43 is a plain `CREATE FUNCTION` (not `CREATE OR REPLACE`),
  which errors with _function already exists_.
- Reordering or de-duplicating that means editing the generated file, which this pass forbids.

So every safe route requires a decision from you. Three options:

**Option A — one hand-authored migration (recommended; matches repo precedent).**
Author a single migration in this order: `CREATE OR REPLACE FUNCTION current_tenant_role()` →
drop + recreate the **11 storage** policies → drop + recreate the **39 public** policies →
`DROP FUNCTION public."current_role"()`. The 39 public statements can be lifted verbatim from
the generated file, so only the storage half is genuinely new writing. This is exactly how
`20260810053816_add_storage_policies.sql` already handles storage in this repo.

**Option B — keep the old function as a deprecated alias.** Create the new one, migrate all
call sites, never drop the old. No dependency failure, but the reserved-word trap stays in the
database and the two definitions can drift. Defeats the point of the rename.

**Option C — leave `policies/storage/*.sql` on the old name.** Revert those 16 call sites,
rename only `public`. The function survives, still un-callable unqualified. Half a fix.

My recommendation is **A**. It is the only one that actually removes the trap, and the
hand-written portion is small and mechanical.

## Repo state right now

I restored a working tree rather than leaving a poisoned `migrations/`:

- The generated migration was **removed from `supabase/migrations/`** and quarantined at
  `…/scratchpad/QUARANTINED_20260811105440.sql` (plus an unmodified copy alongside it). Left in
  place it would have made every future `db reset` and `db push` fail at statement 42.
- `supabase/migrations/` is back to the original **four** files.
- `supabase db reset` re-run afterwards: **clean**. Local database is on a good baseline.
- `supabase/schemas/` still carries the Batch 1 rename, untouched. **The source is correct** —
  the defect is in what the diff engine will emit, not in the SQL.
- The local Supabase stack is left **running**.

## Stop items

1. **The diff omits `storage.objects` policies** — the exact risk flagged going in. Confirmed
   by inspection, by a failed reset, and by an isolated storage-only diff returning nothing.
2. **`db reset` failed** on the generated migration; error captured verbatim above. Not worked
   around.
3. **Landing this needs a hand-written migration** (Option A) or a change of goal (B/C). That
   crosses the "do not hand-write" line, so it is your call before I go further.
4. **The `customers.company` comment delta** rides along and would silently drop the column
   comment. Fixable in the source; not done, out of scope.

**Nothing was pushed. No remote was contacted.**

## Commands run, in order

| #   | Command                                                                                  | Result                                       |
| --- | ---------------------------------------------------------------------------------------- | -------------------------------------------- |
| 1   | `supabase start`                                                                         | stack up (images cached)                     |
| 2   | `supabase db reset`                                                                      | clean — baseline                             |
| 3   | `psql` baseline probe of `pg_policies` / `pg_proc`                                       | 39 public · 11 storage · old fn present      |
| 4   | `supabase db diff --schema public,storage -f rename_current_role_to_current_tenant_role` | file written — **unsafe**                    |
| 5   | inspection (`grep` counts + statement ordering)                                          | 0 storage; DROP FUNCTION at 42               |
| 6   | `supabase db reset`                                                                      | **FAILED** — SQLSTATE 2BP01, 11 storage deps |
| 7   | quarantine generated file; `supabase db reset`                                           | clean — baseline restored                    |
| 8   | `supabase db diff --schema storage` (stdout only)                                        | `No schema changes found` — root cause       |

`supabase db push` was **not** run.
