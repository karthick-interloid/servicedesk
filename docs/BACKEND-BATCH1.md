# Backend Batch 1 — unblock the migration

**Branch:** `feature/authentication` · **Date:** 2026-08-11
**Scope:** the four blockers P0-1, P0-2, P0-3, P4-27. Nothing executed — no `db push`, no
`db diff`, no `db reset`, no query against any database.

---

## Headline: three of the four blockers were already fixed before this pass

`docs/SUPABASE-AUDIT.md` is dated **2026-08-08** and opens with _"No migration has been
generated or pushed. `supabase/migrations/` is empty."_ Both halves of that are now stale:

- `supabase/migrations/` holds **four** files, the oldest being
  `20260810045832_initial_schema.sql` (56 KB, 2026-08-10).
- The whole of `supabase/` first entered git in commit **`e70d586` "setup supabase migration
  and configuration"** — its parent contains no `supabase/` directory at all. So the tree was
  committed in its already-repaired form, and the audit was written against an earlier
  _uncommitted_ working tree that no longer exists anywhere.

The audit's reasoning was correct when written. It simply describes a tree from three days
ago. Every finding below was re-verified by reading the current files.

| ID        | Audit claim                                                       | On disk today                                                          | Action                  |
| --------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------- |
| **P0-1**  | `policies/03_users.sql` filters on non-existent `users.tenant_id` | **Not present** — already uses `auth.uid() = id` + memberships EXISTS  | none needed             |
| **P0-2**  | `current_role()` called unqualified in `09_tickets.sql`           | **Not present** — all 71 references qualified; but the _name_ survives | **renamed** (this pass) |
| **P0-3**  | `CREATE TRIGGER` at the end of `tables/16_sla_events.sql`         | **Not present** — no `CREATE TRIGGER` anywhere in `tables/`            | none needed             |
| **P4-27** | Duplicate prefixes `03_*`/`05_*` in `tables/`, no `01_`           | **Not present** — clean `01_`–`20_`, FK order explicit and correct     | none needed             |

**`supabase db push` is not blocked by any of the four.** The strongest evidence is the
applied migration itself: `20260810045832_initial_schema.sql` contains
`public."current_role"()` — pg_dump's quoted rendering of a reserved-word identifier. That
string can only exist if the function was successfully created in a real database, which
means the declarative source applied cleanly at least once on 2026-08-10.

I did **not** go looking for whatever else might be failing, per the batch's "fix ONLY these
four" instruction. If `db push` is genuinely erroring for you, the error text is the next
thing to capture — the audit's four causes are not it.

---

## The one fix applied: P0-2 — `current_role` → `current_tenant_role`

### Why it was still worth doing

The audit's _diagnosis_ (unqualified call sites in `09_tickets.sql` at lines 19/41/63/87) no
longer holds — that file now writes `public.current_tenant_role()` at lines 21/50/79/110, and
a full-tree sweep found **zero** unqualified call sites:

```
grep -rnE "(^|[^.[:alnum:]_])current_role[[:space:]]*\(" .  →  (none)
```

But the audit's _recommendation_ had never been applied, and the hazard it names is real and
permanent. `CURRENT_ROLE` is a fully-reserved PostgreSQL keyword. `public.current_role()`
parses only because the identifier after the dot is a `ColLabel`, which admits every keyword;
written bare, the parser reduces `current_role` to a `SQLValueFunction` node and then hits the
open paren:

```
ERROR: syntax error at or near "("
```

So the function was callable in exactly one spelling, with nothing in the name to warn the
next author which spelling they were using. That is a latent trap, not a live error —
renaming removes the error class rather than relying on 70 call sites staying disciplined.

A second reason the old name was wrong: it returns the caller's role **within the current
tenant**, read off the JWT claim the access-token hook writes. It has nothing to do with the
Postgres session role that `CURRENT_ROLE` actually reports. The names collided on a concept
they do not share.

### What changed

Definition renamed in `functions/01_current_tenant_id.sql:29`, with a comment recording the
reserved-word reasoning so it does not get "tidied" back. **71 occurrences across 16 files** —
1 definition + 70 call sites:

| File                                      |          Sites |
| ----------------------------------------- | -------------: |
| `functions/01_current_tenant_id.sql`      | 1 (definition) |
| `policies/02_tenants.sql`                 |              4 |
| `policies/03_users.sql`                   |              3 |
| `policies/04_memberships.sql`             |              4 |
| `policies/05_subscriptions.sql`           |              5 |
| `policies/06_customers.sql`               |              5 |
| `policies/07_business_hours.sql`          |              4 |
| `policies/09_tickets.sql`                 |              4 |
| `policies/10_ticket_messages.sql`         |             11 |
| `policies/12_tags.sql`                    |              5 |
| `policies/13_ticket_tags.sql`             |              3 |
| `policies/18_invoices.sql`                |              5 |
| `policies/19_audit_logs.sql`              |              1 |
| `policies/storage/customer_files.sql`     |              3 |
| `policies/storage/invoices.sql`           |              5 |
| `policies/storage/ticket_attachments.sql` |              8 |
| **Total**                                 |         **71** |

Reproduce with `grep -rc "public\.current_tenant_role()" supabase/schemas`.

The diff is **rename-only**. Verified mechanically: every changed line in `policies/` that
does not contain `current_role`/`current_tenant_role` is the empty set.

`current_role` survives in the tree only inside the new explanatory comment.

### Not touched

No references existed outside `schemas/` — nothing in `src/`, no edge function, no test. The
two applied migrations do contain `current_role`, and were correctly left alone: they are
already-run history, not source.

---

## P0-1 — no action needed

`policies/03_users.sql` (110 lines) contains no reference to `users.tenant_id`. It already
uses precisely the forms this batch asked me to write, and `tables/04_users.sql` confirms the
column does not exist (users stays global, 1:1 with `auth.users`).

| Policy         | Form on disk                                                                                                                                    |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `users_select` | `id = auth.uid()` **OR** memberships EXISTS-join scoped by `current_tenant_id()` + `status='active'`                                            |
| `users_insert` | `WITH CHECK (id = auth.uid())` — self only                                                                                                      |
| `users_update` | `id = auth.uid()` OR (`tenant_admin` AND `is_active_membership()` AND memberships EXISTS), **and the same expression repeated in `WITH CHECK`** |
| `users_delete` | `tenant_admin` AND `is_active_membership()` AND memberships EXISTS                                                                              |

The regression the batch warned about is absent: the policy set is non-empty and functioning,
every policy is `TO authenticated` (no `anon` exposure), and `users_update` carries a
`WITH CHECK` rather than a `USING`-only clause.

## P0-3 — no action needed

`grep -rn "CREATE TRIGGER" supabase/schemas/tables/` returns nothing. `tables/15_sla_events.sql`
(not `16_`) ends with three `CREATE INDEX` statements.

The trigger the audit wanted moved already lives in the triggers phase —
`schemas/triggers/tickets_updated_at.sql:21` creates `set_sla_events_updated_at`. It arrived
via the ticket-triggers work rather than as a targeted move, but the outcome is the one P0-3
asked for: it loads after `functions/`, so `update_updated_at_column()` exists by then.

Per instruction, the other missing `updated_at` triggers (P3-14) were left alone.

## P4-27 — no action needed

`tables/` is a clean, gap-free `01_plans` → `20_audit_logs`. No duplicate prefixes; `01_`
exists. Load order is already explicit rather than alphabetical luck, and every FK target
loads strictly before its dependant — verified by extracting each file's `CREATE TABLE` and
its `REFERENCES` targets:

```
03_tenants        → 01_plans
05_memberships    → 03_tenants, 04_users
07_subscriptions  → 01_plans, 03_tenants
08_business_hours → 02_timezones, 03_tenants
09_sla_policies   → 03_tenants, 08_business_hours
10_tickets        → 03_tenants, 04_users, 06_customers, 09_sla_policies
11–20             → all targets ≤ 10
```

No circular dependency. Renumbering would be churn with no correctness gain, so nothing was
renamed.

---

## The migration command — NOT RUN

```
supabase db diff -f rename_current_role_to_current_tenant_role
```

Run from the repo root with the local stack up. This is **not** an initial migration: four
migrations already exist, so `db diff` builds the shadow database from them and diffs the
declarative source against that result. The output should be a fifth, incremental file.

---

## Expected delta, and three things to check before trusting it

The batch asked me to report any delta beyond the four fixes. I cannot run `db diff`, so
these are derived from reading the source against the applied migrations.

**1. The rename will be a large diff, and its ordering is the risk.** Around 70 policies
across 16 files embed the function in their `USING`/`WITH CHECK` expressions, and PostgreSQL
records a hard dependency from each policy to the function. `DROP FUNCTION public."current_role"()`
fails outright while any of them exist:

```
ERROR: cannot drop function ... because other objects depend on it
```

A correct diff drops or recreates every dependent policy _before_ dropping the function.
pg-delta should sequence this, but it is the first thing to confirm in the generated file —
and the reason the local `db reset` proof step matters more than usual this time.

**2. ⚠ Storage policies may be silently omitted.** 16 of the 70 call sites are in
`policies/storage/*.sql`, which create policies on **`storage.objects`**, not `public`.
Diff tools commonly restrict themselves to `public` and exclude Supabase-managed schemas
unless told otherwise — and there is circumstantial evidence that happened here already:
storage policies were shipped as a **separate, hand-shaped** migration
(`20260810053816_add_storage_policies.sql`) rather than appearing in the generated initial
schema.

If the generated file contains no `storage.objects` policies, do **not** push it. The database
would drop `public."current_role"()` while 16 storage policies still call it — either the
migration fails on the dependency, or storage RLS is left broken. Check the generated file for
`storage.objects`; if absent, re-run with the schema included:

```
supabase db diff -f rename_current_role_to_current_tenant_role --schema public,storage
```

**3. A possible unrelated comment delta.** `20260810210000_add_customer_company.sql` sets
`COMMENT ON COLUMN public.customers.company`, but the declarative source
(`tables/06_customers.sql`) declares the column with no `COMMENT`. If pg-delta diffs comments,
it will emit a comment drop. Harmless, but it is delta beyond the rename — drop it from the
generated file rather than pushing an accidental comment removal.

Everything else uncommitted in `supabase/` is already covered and should produce **no** delta:

- `tables/06_customers.sql` `+company` ↔ `20260810210000_add_customer_company.sql`
- `schemas/triggers/tickets_*.sql` ↔ `20260810210100_add_ticket_triggers.sql` (7 objects, 1:1)
- `seeds/02_timezone_seed.sql` — seeds are in `[db.seed] sql_paths`, not `schema_paths`
- `config.toml` — auth redirect URLs and the Google provider only; `schema_paths` untouched

---

## Stop items

1. **The batch's premise does not hold.** Three of four blockers do not exist, and the source
   demonstrably applied on 2026-08-10. Before Batch 2, worth deciding whether
   `docs/SUPABASE-AUDIT.md` should be re-run against the current tree — the remaining 29 open
   findings are from the same stale snapshot and may be in the same condition.
2. **`migrations/` is not empty**, so the intended "generate one clean initial migration"
   sequence does not apply. The corrected sequence is: `db diff` → inspect (checks 1–3 above)
   → `db reset` locally to prove it builds → `db push`.
3. **Storage-schema coverage** (check 2) is the one item that could turn this rename into a
   broken push. It needs a human eye on the generated file.
4. `schema_paths` includes `./schemas/indexes/*.sql`, but no `indexes/` directory exists. The
   glob matches nothing and has evidently been harmless, but it is dead configuration.

## Verification run

| Check                                           | Result |
| ----------------------------------------------- | ------ |
| Unqualified `current_role(` anywhere            | none   |
| `public.current_role()` remaining in `schemas/` | none   |
| `public.current_tenant_role()` occurrences      | 71     |
| Definitions of `current_tenant_role`            | 1      |
| Non-rename changed lines in `policies/`         | 0      |
| Anything executed against a database            | no     |
