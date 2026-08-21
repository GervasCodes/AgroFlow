// Outbound WhatsApp message sending via the Meta Cloud API, plus the
// one-time webhook subscription call (see registerWebhookSubscription
// below) that tells Meta to actually start POSTing inbound messages to
// this service's /webhook endpoint -- separate from the GET /webhook
// handshake in index.ts, which only verifies a URL Meta already knows
// about. Falls back to logging when WHATSAPP_ACCESS_TOKEN/
// WHATSAPP_PHONE_NUMBER_ID aren't set, same pattern as every other
// integration in this codebase.
const GRAPH_API_VERSION = process.env.WHATSAPP_GRAPH_API_VERSION ?? "v20.0";
const GRAPH_BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export async function sendWhatsAppMessage(to: string, text: string): Promise<void> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    console.log(`[dev-only, WhatsApp creds not configured] To ${to}:\n${text}`);
    return;
  }

  try {
    const res = await fetch(`${GRAPH_BASE_URL}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      }),
    });

    if (!res.ok) {
      console.error(`WhatsApp send failed (${res.status}):`, await res.text());
    }
  } catch (err) {
    console.error("WhatsApp send error:", err);
  }
}

/** One-time (idempotent -- safe to call on every startup) call that
 * subscribes this app to receive webhook events for the configured
 * WhatsApp Business Account. Meta requires this in addition to
 * registering the callback URL + verify token in the App Dashboard --
 * without it, messages sent TO the business number never reach
 * POST /webhook, no matter how correctly that handler is written.
 * No-ops (and just logs) when credentials aren't configured. */
export async function registerWebhookSubscription(): Promise<void> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

  if (!accessToken || !businessAccountId) {
    console.log("[dev-only, WhatsApp creds not configured] Skipping webhook subscription registration.");
    return;
  }

  try {
    const res = await fetch(`${GRAPH_BASE_URL}/${businessAccountId}/subscribed_apps`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const body = await res.json().catch(() => null);
    if (!res.ok) {
      console.error(`WhatsApp webhook subscription failed (${res.status}):`, body);
      return;
    }

    console.log("WhatsApp webhook subscription confirmed:", body);
  } catch (err) {
    console.error("WhatsApp webhook subscription error:", err);
  }
}
