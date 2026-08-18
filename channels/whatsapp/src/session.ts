// Per-sender conversation state. Unlike USSD (where the gateway resends
// the full input history every request, so the current step is derived
// from that text), WhatsApp delivers one message at a time with no
// history -- so this service must remember which step of a flow each
// sender is on. Same in-memory-with-TTL tradeoff as
// channels/ussd/src/session.ts: fine for one instance, move to Redis
// (REDIS_URL) if this ever scales past that.
export type FlowStep =
  | "MAIN_MENU"
  | "SELL_CHOOSE_FARM"
  | "SELL_CHOOSE_CROP"
  | "SELL_ENTER_QUANTITY"
  | "SELL_CONFIRM";

export interface ConversationState {
  step: FlowStep;
  farms?: { id: string; name: string }[];
  farmId?: string;
  crop?: string;
  quantity?: number;
  updatedAt: number;
}

const SESSION_TTL_MS = 15 * 60 * 1000; // WhatsApp conversations are slower-paced than USSD
const sessions = new Map<string, ConversationState>();

export function getState(senderId: string): ConversationState {
  const existing = sessions.get(senderId);
  if (existing && Date.now() - existing.updatedAt < SESSION_TTL_MS) return existing;
  const fresh: ConversationState = { step: "MAIN_MENU", updatedAt: Date.now() };
  sessions.set(senderId, fresh);
  return fresh;
}

export function setState(senderId: string, patch: Partial<ConversationState>): void {
  sessions.set(senderId, { ...getState(senderId), ...patch, updatedAt: Date.now() });
}

export function resetState(senderId: string): void {
  sessions.set(senderId, { step: "MAIN_MENU", updatedAt: Date.now() });
}

function sweepExpired(): void {
  const now = Date.now();
  for (const [id, state] of sessions) {
    if (now - state.updatedAt > SESSION_TTL_MS) sessions.delete(id);
  }
}
setInterval(sweepExpired, 60_000).unref();
