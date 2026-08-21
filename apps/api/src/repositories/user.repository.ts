// Data-access layer for users + their roles/permissions. Services call
// repositories, never Prisma directly, so data-access patterns stay
// consistent and testable.
import { prisma } from "../lib/prisma.js";

// Includes the joins needed to flatten roles -> permission keys in one
// query (see services/users -> toAuthenticatedUser).
const userWithRolesInclude = {
  roles: {
    include: {
      role: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
    },
  },
} as const;

export type UserWithRoles = NonNullable<
  Awaited<ReturnType<typeof findUserById>>
>;

export function findUserByPhone(phoneNumber: string) {
  return prisma.user.findUnique({
    where: { phoneNumber },
    include: userWithRolesInclude,
  });
}

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: userWithRolesInclude,
  });
}

export function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: userWithRolesInclude,
  });
}

/** Admin-only listing (see routes/users.routes.ts) -- most recent
 * accounts first, capped rather than paginated since the Admin Console
 * is the only caller today. */
export function findAllUsers() {
  return prisma.user.findMany({
    include: userWithRolesInclude,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export function createUser(input: {
  phoneNumber: string;
  fullName: string;
  passwordHash?: string;
  preferredLanguage: "en" | "sw";
  regionId?: string;
  email?: string;
}) {
  return prisma.user.create({
    data: {
      phoneNumber: input.phoneNumber,
      fullName: input.fullName,
      passwordHash: input.passwordHash,
      preferredLanguage: input.preferredLanguage,
      regionId: input.regionId,
      email: input.email,
      // No roles created here by design -- registration no longer accepts
      // a self-selected role. See role-request.repository.ts.
    },
    include: userWithRolesInclude,
  });
}

export function markUserVerified(userId: string) {
  return prisma.user.update({ where: { id: userId }, data: { isVerified: true } });
}

export function updatePreferredChannel(userId: string, preferredChannel: string) {
  return prisma.user.update({ where: { id: userId }, data: { preferredChannel } });
}
