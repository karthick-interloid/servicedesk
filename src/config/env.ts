import { z } from "zod";

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  SESSION_SECRET: z.string().min(32),
  SENTRY_DSN: z.preprocess(emptyToUndefined, z.string().url().optional()),
  SENTRY_ORG: z.preprocess(emptyToUndefined, z.string().optional()),
  SENTRY_PROJECT: z.preprocess(emptyToUndefined, z.string().optional()),
  SENTRY_AUTH_TOKEN: z.preprocess(emptyToUndefined, z.string().optional()),

  // Full-database credential that bypasses RLS. Deliberately NOT prefixed NEXT_PUBLIC_, so
  // Next cannot inline it into a client bundle, and deliberately in `serverSchema` rather
  // than `clientSchema`. Only `src/lib/supabase/admin.ts` reads it.
  SUPABASE_SERVICE_ROLE_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
});

const clientSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEXT_PUBLIC_SITE_NAME: z.string().min(1),
  NEXT_PUBLIC_SITE_DESCRIPTION: z.string().min(1),
  NEXT_PUBLIC_TWITTER_HANDLE: z.preprocess(emptyToUndefined, z.string().startsWith("@").optional()),
  NEXT_PUBLIC_SENTRY_DSN: z.preprocess(emptyToUndefined, z.string().url().optional()),

  // Optional, not required, so a checkout without Supabase keys still boots — the design
  // system and token pages don't touch auth. `src/lib/supabase/server.ts` throws a named
  // error the first time a caller actually needs them.
  //
  // The anon/publishable key is safe to expose: it grants nothing on its own, because
  // every table is behind RLS. There is intentionally no SERVICE_ROLE_KEY here.
  NEXT_PUBLIC_SUPABASE_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
});

const parsed = serverSchema.extend(clientSchema.shape).safeParse(process.env);

if (!parsed.success) {
  throw new Error(
    `Invalid environment variables:\n${JSON.stringify(parsed.error.flatten().fieldErrors, null, 2)}`,
  );
}

export const env = parsed.data;
