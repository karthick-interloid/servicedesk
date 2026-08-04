import Link from "next/link";
import { Activity, CheckCircle2, GitBranch, ShieldCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const badges = ["TypeScript strict mode", "Security headers verified", "CI on every push"];

const features = [
  {
    icon: ShieldCheck,
    title: "Security by default",
    description:
      "CSP, HSTS, and four other headers applied to every route — verified against a running server, not just present in config.",
  },
  {
    icon: Activity,
    title: "Error handling & monitoring",
    description:
      "Error boundaries, a 404 page, and Sentry wired end-to-end, confirmed with real events reaching the dashboard.",
  },
  {
    icon: GitBranch,
    title: "CI that catches regressions",
    description:
      "Lint, format, typecheck, and build run on every push against the exact Node/npm versions the pipeline uses.",
  },
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
        <span className="text-xs font-semibold tracking-wide text-accent uppercase">
          Next.js starter template
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Ship production-ready apps in minutes, not months.
        </h1>
        <p className="max-w-xl text-lg text-balance text-muted-foreground">
          Error handling, security headers, CI, and monitoring — all wired up and verified, so you
          can start building features on day one.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <a href="#features" className={cn(buttonVariants({ size: "lg" }))}>
            Explore the features
          </a>
          <Link href="/about" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
            Learn more
          </Link>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {badges.map((badge) => (
            <span key={badge} className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-accent" />
              {badge}
            </span>
          ))}
        </div>
      </section>

      <section id="features" className="border-t border-border px-6 py-16">
        <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex flex-col gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
              <h2 className="text-base font-semibold">{title}</h2>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
