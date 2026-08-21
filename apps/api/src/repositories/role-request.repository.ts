// Data-access for RoleRequest records (Identity domain). A user requests a
// role after registering; an ADMIN approves/rejects it. Approval also
// writes the UserRole row in the same transaction so a request can never
// be left "APPROVED" without the grant actually taking effect.
import { prisma } from "../lib/prisma.js";

export function findPendingRequestForUser(userId: string, requestedRole: string) {
  return prisma.roleRequest.findFirst({
    where: { userId, requestedRole, status: "PENDING" },
  });
}

export function createRoleRequest(input: { userId: string; requestedRole: string; scopeId?: string }) {
  return prisma.roleRequest.create({ data: input });
}

export function findRoleRequestById(id: string) {
  return prisma.roleRequest.findUnique({ where: { id } });
}

export function findRequestsByUser(userId: string) {
  return prisma.roleRequest.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export function findPendingRequests() {
  return prisma.roleRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { id: true, fullName: true, phoneNumber: true } } },
  });
}

/** Approves a request and grants the role in one transaction: writes the
 * UserRole (idempotent -- upsert on the unique [userId, roleId, scopeId]
 * constraint) and marks the request APPROVED with reviewer + timestamp. */
export function approveRoleRequest(input: {
  requestId: string;
  roleId: string;
  reviewedByUserId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.roleRequest.update({
      where: { id: input.requestId },
      data: {
        status: "APPROVED",
        reviewedByUserId: input.reviewedByUserId,
        reviewedAt: new Date(),
      },
    });

    await tx.userRole.upsert({
      where: {
        userId_roleId_scopeId: {
          userId: request.userId,
          roleId: input.roleId,
          scopeId: request.scopeId ?? null,
        },
      },
      create: {
        userId: request.userId,
        roleId: input.roleId,
        scopeId: request.scopeId,
      },
      update: {},
    });

    return request;
  });
}

export function rejectRoleRequest(input: { requestId: string; reviewedByUserId: string; reason?: string }) {
  return prisma.roleRequest.update({
    where: { id: input.requestId },
    data: {
      status: "REJECTED",
      reviewedByUserId: input.reviewedByUserId,
      reviewedAt: new Date(),
      rejectionReason: input.reason,
    },
  });
}
