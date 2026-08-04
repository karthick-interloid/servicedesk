// Lightweight liveness endpoint for container/orchestrator health checks
// (Docker HEALTHCHECK, Kubernetes probes, load balancers). Intentionally has no
// dependencies — no validated env, no DB, no rendering — so it stays cheap and
// answers as long as the process is up, even if app config is broken.
import { timingSafeEqual } from "node:crypto";

// Always run fresh; never statically cache a health response.
export const dynamic = "force-dynamic";

// Constant-time compare so a protected endpoint doesn't leak the token via timing.
function tokenMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function GET(request: Request): Promise<Response> {
  // Read directly from process.env (not the validated env module) on purpose, so
  // health reporting never depends on the rest of the config being valid.
  const expected = process.env.HEALTH_CHECK_TOKEN;

  // Optional protection: only enforced when HEALTH_CHECK_TOKEN is set. Left unset,
  // the endpoint is open — which is the zero-config default for Docker/k8s.
  if (expected) {
    const header = request.headers.get("authorization") ?? "";
    const provided = header.startsWith("Bearer ") ? header.slice(7) : "";
    // 404 rather than 401: a protected health check should be indistinguishable
    // from a route that doesn't exist — hidden as well as gated.
    if (!provided || !tokenMatches(provided, expected)) {
      return new Response("Not Found", { status: 404 });
    }
  }

  return Response.json({ status: "ok" }, { status: 200 });
}
