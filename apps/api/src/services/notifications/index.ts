// Fire-and-forget dispatch to channels/sms's /notify endpoint. Failures
// are logged, never thrown -- a notification failing must never break
// the business operation that triggered it (approving a match still
// succeeds even if the SMS didn't send). SMS_NOTIFY_URL and
// INTERNAL_SERVICE_SECRET are optional: if unset, notifications are
// silently skipped rather than erroring, so environments without the
// SMS service running (e.g. most local dev) aren't forced to run it.
const NOTIFY_URL = process.env.SMS_NOTIFY_URL; // e.g. http://localhost:4200/notify
const SECRET = process.env.INTERNAL_SERVICE_SECRET;

type NotifyPayload =
  | { phoneNumber: string; type: "match_proposed"; data: { cropLabel: string; quantity: number; unit: string } }
  | { phoneNumber: string; type: "match_approved"; data: { cropLabel: string; quantity: number; unit: string } }
  | { phoneNumber: string; type: "payment_confirmed"; data: { amount: number; currency: string } }
  | { phoneNumber: string; type: "shipment_delivered"; data: { deliveryLocation: string } };

export function notify(payload: NotifyPayload): void {
  if (!NOTIFY_URL || !SECRET) return; // notifications not configured in this environment

  fetch(NOTIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Internal-Service-Secret": SECRET },
    body: JSON.stringify(payload),
  }).catch((err) => {
    console.error("Failed to dispatch SMS notification:", err);
  });
}
