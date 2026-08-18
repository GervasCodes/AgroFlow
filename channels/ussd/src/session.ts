// USSD sessions are gateway-managed and stateless-per-request -- the
// gateway resends the full accumulated `text` on every hop, so in
// principle we don't NEED server-side memory. We keep a short-lived
// cache anyway so a numbered list (e.g. "your farms: 1. X 2. Y") maps
// back to a stable farmId even if two farms could otherwise tie/reorder
// between requests. TTL matches typical gateway session timeouts
// (30-180s) with headroom; swap for Redis (REDIS_URL is already in
// .env.example) if this ever runs as more than one instance.
export interface UssdSessionContext {
  farms?: { id: string; name: string }[];
  farmId?: string;
  crop?: string;
  quantity?: number;
  createdAt: number;
}

const SESSION_TTL_MS = 3 * 60 * 1000;
const sessions = new Map<string, UssdSessionContext>();

export function getSession(sessionId: string): UssdSessionContext {
  const existing = sessions.get(sessionId);
  if (existing) return existing;
  const fresh: UssdSessionContext = { createdAt: Date.now() };
  sessions.set(sessionId, fresh);
  return fresh;
}

export function updateSession(sessionId: string, patch: Partial<UssdSessionContext>): void {
  sessions.set(sessionId, { ...getSession(sessionId), ...patch });
}

export function endSession(sessionId: string): void {
  sessions.delete(sessionId);
}

function sweepExpired(): void {
  const now = Date.now();
  for (const [id, ctx] of sessions) {
    if (now - ctx.createdAt > SESSION_TTL_MS) sessions.delete(id);
  }
}

setInterval(sweepExpired, 60_000).unref();
