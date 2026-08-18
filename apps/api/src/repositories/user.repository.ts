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

export function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: userWithRolesInclude,
  });
}

export function createUser(input: {
  phoneNumber: string;
  fullName: string;
  passwordHash?: string;
  preferredLanguage: "en" | "sw";
  regionId?: string;
  roleId: string;
}) {
  return prisma.user.create({
    data: {
      phoneNumber: input.phoneNumber,
      fullName: input.fullName,
      passwordHash: input.passwordHash,
      preferredLanguage: input.preferredLanguage,
      regionId: input.regionId,
      roles: {
        create: [{ roleId: input.roleId }],
      },
    },
    include: userWithRolesInclude,
  });
}

export function markUserVerified(userId: string) {
  return prisma.user.update({ where: { id: userId }, data: { isVerified: true } });
}
