// Data-access for OTP codes (phone-based login, Section 24).
import { prisma } from "../lib/prisma.js";

export function createOtp(userId: string, codeHash: string, expiresAt: Date) {
  return prisma.otpCode.create({ data: { userId, codeHash, expiresAt } });
}

export function findLatestActiveOtp(userId: string) {
  return prisma.otpCode.findFirst({
    where: { userId, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
}

export function consumeOtp(otpId: string) {
  return prisma.otpCode.update({ where: { id: otpId }, data: { consumedAt: new Date() } });
}
