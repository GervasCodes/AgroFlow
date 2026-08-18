// Outbound SMS sending. NO live gateway call is made here yet -- same
// pattern as apps/api's OTP delivery (Phase 3) and payments (Phase 12):
// SMS_API_KEY is unconfigured, so sendSms() logs the message instead of
// calling a real provider. This keeps the function signature real
// integration slots into without touching any caller.
export async function sendSms(to: string, message: string): Promise<void> {
  const apiKey = process.env.SMS_API_KEY;

  if (!apiKey) {
    console.log(`[dev-only, no SMS_API_KEY configured] SMS to ${to}: ${message}`);
    return;
  }

  // TODO(real integration): call the configured SMS gateway's send API
  // here using `apiKey`. Left unimplemented until a specific provider
  // is chosen and credentials exist -- see .env.example's SMS_API_KEY.
  console.log(`[SMS_API_KEY set but no gateway wired up yet] SMS to ${to}: ${message}`);
}
