// Outbound WhatsApp message sending via the Meta Cloud API. NO live
// call is made here yet -- WHATSAPP_ACCESS_TOKEN/WHATSAPP_PHONE_NUMBER_ID
// are unconfigured (see .env.example), so sendWhatsAppMessage() logs
// instead, same pattern as channels/sms/src/gateway.ts.
export async function sendWhatsAppMessage(to: string, text: string): Promise<void> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    console.log(`[dev-only, WhatsApp creds not configured] To ${to}:\n${text}`);
    return;
  }

  // TODO(real integration): POST to
  // https://graph.facebook.com/v20.0/{phoneNumberId}/messages with
  // Authorization: Bearer {accessToken} once real Meta Business
  // credentials exist.
  console.log(`[WhatsApp creds set but no live call wired up yet] To ${to}:\n${text}`);
}
