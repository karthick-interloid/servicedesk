import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "About",
  description: "Why this starter template exists and what it sets up for you.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About",
    description: "Why this starter template exists and what it sets up for you.",
    url: "/about",
  },
};

const pillars = [
  {
    title: "Verified, not just configured",
    description:
      "Every feature in this template was tested against a running server — real HTTP responses, real headers, real Sentry events — not just code that compiles.",
  },
  {
    title: "Documented decisions, not just state",
    description:
      "docs/ explains why each piece is built the way it is, including tradeoffs and the alternatives that were tried and dropped.",
  },
  {
    title: "Production-shaped from day one",
    description:
      "Error boundaries, security headers, and CI aren't things you bolt on before shipping — they're already here, so you build features on top of a solid base.",
  },
];

export default function AboutPage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col gap-10 px-6 py-24">
      <div className="flex flex-col gap-4">
        <span className="text-xs font-semibold tracking-wide text-accent uppercase">About</span>
        <h1 className="text-3xl font-semibold tracking-tight">About {siteConfig.name}</h1>
        <p className="text-lg text-balance text-muted-foreground">
          This is a sample page demonstrating per-page metadata overrides — see{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm">src/app/about/page.tsx</code> for
          how the <code className="rounded bg-muted px-1.5 py-0.5 text-sm">metadata</code> export
          replaces the root layout&apos;s title, description, and Open Graph data for this one
          route, while everything else — error handling, security headers, loading states — still
          applies automatically.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {pillars.map(({ title, description }) => (
          <div key={title} className="border-l-2 border-border pl-4">
            <h2 className="text-base font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        ))}
      </div>

      <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "self-start")}>
        Back home
      </Link>
    </main>
  );
}
