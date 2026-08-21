// Outbound SMS sending via Africa's Talking -- the standard SMS gateway
// for Tanzania/East Africa (already the provider named in
// apps/api/src/integrations/ussd-gateway's own header comment). Falls
// back to logging when AT_API_KEY/AT_USERNAME aren't set, same pattern
// as every other integration in this codebase, so local dev never needs
// real credentials.
const AT_API_KEY = process.env.AT_API_KEY;
const AT_USERNAME = process.env.AT_USERNAME;
// "sandbox" is Africa's Talking's own username for their test
// environment -- switch AT_BASE_URL along with real prod credentials.
const AT_BASE_URL = process.env.AT_BASE_URL ?? "https://api.sandbox.africastalking.com/version1/messaging";
const AT_SENDER_ID = process.env.AT_SENDER_ID; // optional: registered shortcode/alphanumeric sender ID

export async function sendSms(to: string, message: string): Promise<void> {
  if (!AT_API_KEY || !AT_USERNAME) {
    console.log(`[dev-only, no AT_API_KEY/AT_USERNAME configured] SMS to ${to}: ${message}`);
    return;
  }

  const body = new URLSearchParams({
    username: AT_USERNAME,
    to,
    message,
    ...(AT_SENDER_ID ? { from: AT_SENDER_ID } : {}),
  });

  try {
    const res = await fetch(AT_BASE_URL, {
      method: "POST",
      headers: {
        apiKey: AT_API_KEY,
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const responseBody = await res.json().catch(() => null);
    if (!res.ok) {
      console.error(`Africa's Talking SMS send failed (${res.status}):`, responseBody);
      return;
    }

    // A 200 from Africa's Talking can still carry a per-recipient
    // failure in SMSMessageData.Recipients[].status -- log it rather
    // than throw, matching every other channel gateway's
    // never-break-the-caller rule (see services/notifications).
    const recipients = (responseBody as { SMSMessageData?: { Recipients?: { status: string }[] } } | null)
      ?.SMSMessageData?.Recipients;
    const failed = recipients?.find((r) => r.status !== "Success");
    if (failed) {
      console.error(`Africa's Talking rejected SMS to ${to}:`, failed);
    }
  } catch (err) {
    console.error("Africa's Talking SMS send error:", err);
  }
}
