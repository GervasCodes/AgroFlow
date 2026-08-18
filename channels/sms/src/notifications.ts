// Notification message builders -- one function per event type apps/api
// triggers a notification for (see routes/notify.ts for how a request
// arrives). Kiswahili-first with an English gloss, kept short (SMS
// pricing is per-segment, ~160 chars per segment).
import { sendSms } from "./gateway.js";

export interface MatchProposedData {
  cropLabel: string;
  quantity: number;
  unit: string;
}
export function notifyMatchProposed(phoneNumber: string, data: MatchProposedData) {
  return sendSms(
    phoneNumber,
    `AgroFlow: Mnunuzi anataka kununua ${data.quantity}${data.unit} ${data.cropLabel} kwako. Angalia programu/tovuti kuidhinisha. (A buyer wants to buy from you -- check the app to approve.)`,
  );
}

export interface MatchApprovedData {
  cropLabel: string;
  quantity: number;
  unit: string;
}
export function notifyMatchApproved(phoneNumber: string, data: MatchApprovedData) {
  return sendSms(
    phoneNumber,
    `AgroFlow: Agizo limethibitishwa -- ${data.quantity}${data.unit} ${data.cropLabel}. Order confirmed.`,
  );
}

export interface PaymentConfirmedData {
  amount: number;
  currency: string;
}
export function notifyPaymentConfirmed(phoneNumber: string, data: PaymentConfirmedData) {
  return sendSms(
    phoneNumber,
    `AgroFlow: Malipo ya ${data.currency} ${data.amount.toLocaleString()} yamethibitishwa. Payment confirmed.`,
  );
}

export interface ShipmentDeliveredData {
  deliveryLocation: string;
}
export function notifyShipmentDelivered(phoneNumber: string, data: ShipmentDeliveredData) {
  return sendSms(phoneNumber, `AgroFlow: Mzigo umewasili ${data.deliveryLocation}. Delivery complete.`);
}
