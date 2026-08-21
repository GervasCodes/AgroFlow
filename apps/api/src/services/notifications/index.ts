// Fire-and-forget dispatch to channels/sms's /notify endpoint. Failures
// are logged, never thrown -- a notification failing must never break
// the business operation that triggered it (approving a match still
// succeeds even if the SMS didn't send). SMS_NOTIFY_URL and
// INTERNAL_SERVICE_SECRET are optional: if unset, notifications are
// silently skipped rather than erroring, so environments without the
// SMS service running (e.g. most local dev) aren't forced to run it.
//
// Every dispatch attempt is also logged to SMSMessage (best-effort, same
// fire-and-forget rule) -- that log is what Phase 5's Analytics reads
// for channel-mix, and what channels/sms's real gateway (Phase 4) will
// update from QUEUED to SENT/DELIVERED/FAILED once it exists.
import type { AuthenticatedUser } from "@agroflow/types";
import type { UpdateNotificationPreferencesInput } from "@agroflow/validation";
import { notificationLogRepository, userRepository } from "../../repositories/index.js";
import { AppError } from "../../utils/AppError.js";

const NOTIFY_URL = process.env.SMS_NOTIFY_URL; // e.g. http://localhost:4200/notify
const SECRET = process.env.INTERNAL_SERVICE_SECRET;

type NotifyPayload =
  | { phoneNumber: string; type: "otp_code"; data: { code: string; expiresInMinutes: number } }
  | { phoneNumber: string; type: "match_proposed"; data: { cropLabel: string; quantity: number; unit: string } }
  | { phoneNumber: string; type: "match_approved"; data: { cropLabel: string; quantity: number; unit: string } }
  | { phoneNumber: string; type: "payment_confirmed"; data: { amount: number; currency: string } }
  | { phoneNumber: string; type: "shipment_delivered"; data: { deliveryLocation: string } };

// Plain-text rendering of a payload -- used for the SMSMessage log
// below. The actual SMS wording sent to the gateway is built
// separately by channels/sms/src/notifications.ts from `data`, so
// copy only needs to be written once, not duplicated across services.
function messageFor(payload: NotifyPayload): string {
  switch (payload.type) {
    case "otp_code":
      return `Your AgroFlow code: ${payload.data.code} (expires in ${payload.data.expiresInMinutes} min)`;
    case "match_proposed":
      return `New match proposed: ${payload.data.quantity} ${payload.data.unit} of ${payload.data.cropLabel}`;
    case "match_approved":
      return `Match approved: ${payload.data.quantity} ${payload.data.unit} of ${payload.data.cropLabel}`;
    case "payment_confirmed":
      return `Payment confirmed: ${payload.data.amount} ${payload.data.currency}`;
    case "shipment_delivered":
      return `Delivered to ${payload.data.deliveryLocation}`;
  }
}

// Text written to the SMSMessage log (readable later by Admin/Analytics)
// -- an OTP code is a live credential, so it's redacted here even though
// the real code is still sent to the gateway via messageFor() above.
function logSummaryFor(payload: NotifyPayload): string {
  if (payload.type === "otp_code") {
    return `Your AgroFlow code: [redacted] (expires in ${payload.data.expiresInMinutes} min)`;
  }
  return messageFor(payload);
}

export function notify(payload: NotifyPayload): void {
  notificationLogRepository
    .logSms({ phoneNumber: payload.phoneNumber, body: logSummaryFor(payload) })
    .catch((err) => console.error("Failed to log notification:", err));

  if (!NOTIFY_URL || !SECRET) return; // notifications not configured in this environment

  fetch(NOTIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Internal-Service-Secret": SECRET },
    body: JSON.stringify(payload),
  }).catch((err) => {
    console.error("Failed to dispatch SMS notification:", err);
  });
}

export async function getPreferences(user: AuthenticatedUser) {
  const record = await userRepository.findUserById(user.id);
  if (!record) throw AppError.notFound("User not found");
  return { preferredChannel: record.preferredChannel };
}

export async function updatePreferences(user: AuthenticatedUser, input: UpdateNotificationPreferencesInput) {
  const updated = await userRepository.updatePreferredChannel(user.id, input.preferredChannel);
  return { preferredChannel: updated.preferredChannel };
}

export function getHistory(user: AuthenticatedUser) {
  return notificationLogRepository.findSmsHistory(user.phoneNumber);
}
