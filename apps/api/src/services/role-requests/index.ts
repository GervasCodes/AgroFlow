// Business logic for the role-request flow: a user requests a role after
// registering (no more self-selected role at signup); an ADMIN
// (role:approve permission) reviews and approves/rejects it. Approval and
// rejection are logged via reviewedByUserId + reviewedAt on the request
// itself -- see repositories/role-request.repository.ts.
import type { RoleRequest } from "@agroflow/types";
import type { RequestRoleInput } from "@agroflow/validation";
import { roleRepository, roleRequestRepository } from "../../repositories/index.js";
import { AppError } from "../../utils/AppError.js";

export async function requestRole(userId: string, input: RequestRoleInput): Promise<RoleRequest> {
  const role = await roleRepository.findRoleByName(input.role);
  if (!role) throw AppError.badRequest(`Unknown role: ${input.role}`);

  const existingPending = await roleRequestRepository.findPendingRequestForUser(userId, input.role);
  if (existingPending) {
    throw AppError.conflict("You already have a pending request for this role");
  }

  return roleRequestRepository.createRoleRequest({
    userId,
    requestedRole: input.role,
    scopeId: input.scopeId,
  }) as unknown as Promise<RoleRequest>;
}

export function listMyRoleRequests(userId: string) {
  return roleRequestRepository.findRequestsByUser(userId);
}

export function listPendingRoleRequests() {
  return roleRequestRepository.findPendingRequests();
}

async function getPendingRequestOrThrow(requestId: string) {
  const request = await roleRequestRepository.findRoleRequestById(requestId);
  if (!request) throw AppError.notFound("Role request not found");
  if (request.status !== "PENDING") {
    throw AppError.conflict(`This request has already been ${request.status.toLowerCase()}`);
  }
  return request;
}

export async function approveRoleRequest(adminId: string, requestId: string): Promise<RoleRequest> {
  const request = await getPendingRequestOrThrow(requestId);

  const role = await roleRepository.findRoleByName(request.requestedRole);
  if (!role) throw AppError.badRequest(`Unknown role: ${request.requestedRole}`);

  const approved = await roleRequestRepository.approveRoleRequest({
    requestId,
    roleId: role.id,
    reviewedByUserId: adminId,
  });

  // Approval log: who approved, what, and when -- reviewedByUserId +
  // reviewedAt above is the durable record; this line is a lightweight
  // operational trace until the full AuditLog model lands.
  console.log(`[role-request] ${adminId} approved role request ${requestId} at ${new Date().toISOString()}`);

  return approved as unknown as RoleRequest;
}

export async function rejectRoleRequest(
  adminId: string,
  requestId: string,
  reason?: string,
): Promise<RoleRequest> {
  await getPendingRequestOrThrow(requestId);

  const rejected = await roleRequestRepository.rejectRoleRequest({
    requestId,
    reviewedByUserId: adminId,
    reason,
  });

  console.log(`[role-request] ${adminId} rejected role request ${requestId} at ${new Date().toISOString()}`);

  return rejected as unknown as RoleRequest;
}
