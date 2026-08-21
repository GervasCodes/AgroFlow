// Data-access for the SMSMessage / WhatsAppMessage logs (Channel domain).
// Written by services/notifications each time it dispatches; the actual
// provider integration (real send + delivery webhooks) is Phase 4's
// channels/sms and channels/whatsapp -- this is the log those will
// eventually update from QUEUED -> SENT/DELIVERED/FAILED.
import { prisma } from "../lib/prisma.js";
import type { MessageStatus } from "@prisma/client";

export function logSms(input: { phoneNumber: string; body: string; status?: MessageStatus }) {
  return prisma.sMSMessage.create({
    data: { phoneNumber: input.phoneNumber, body: input.body, status: input.status ?? "QUEUED" },
  });
}

export function logWhatsApp(input: {
  phoneNumber: string;
  body: string;
  templateName?: string;
  status?: MessageStatus;
}) {
  return prisma.whatsAppMessage.create({
    data: {
      phoneNumber: input.phoneNumber,
      body: input.body,
      templateName: input.templateName,
      status: input.status ?? "QUEUED",
    },
  });
}

export function findSmsHistory(phoneNumber: string) {
  return prisma.sMSMessage.findMany({ where: { phoneNumber }, orderBy: { createdAt: "desc" }, take: 50 });
}

export function findWhatsAppHistory(phoneNumber: string) {
  return prisma.whatsAppMessage.findMany({ where: { phoneNumber }, orderBy: { createdAt: "desc" }, take: 50 });
}
