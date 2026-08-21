// Business logic for the "users" domain. Controllers call into this
// service layer; the service layer calls repositories/ for data access.
// Keep business rules here, not in controllers or on the frontend.
import type { AuthenticatedUser, RoleName } from "@agroflow/types";
import { userRepository, type UserWithRoles } from "../../repositories/index.js";
import { AppError } from "../../utils/AppError.js";

/**
 * Flattens a user's UserRole -> Role -> RolePermission -> Permission chain
 * into the shape RBAC actually checks against: a list of role names and a
 * de-duplicated list of "resource:action" permission keys. This runs once
 * at login/refresh time and the result is embedded in the access token, so
 * middleware/rbac.ts never has to hit the database per request.
 */
export function toAuthenticatedUser(user: UserWithRoles): AuthenticatedUser {
  const roles = user.roles.map((ur) => ur.role.name as RoleName);

  const permissionSet = new Set<string>();
  for (const userRole of user.roles) {
    for (const rp of userRole.role.permissions) {
      permissionSet.add(rp.permission.key);
    }
  }

  return {
    id: user.id,
    phoneNumber: user.phoneNumber,
    fullName: user.fullName,
    roles,
    permissions: Array.from(permissionSet),
  };
}

export async function getUserOrThrow(userId: string): Promise<UserWithRoles> {
  const user = await userRepository.findUserById(userId);
  if (!user) throw AppError.notFound("User not found");
  return user;
}

/** Admin Console's user list (verify users / monitor activity). */
export function listUsers() {
  return userRepository.findAllUsers();
}
