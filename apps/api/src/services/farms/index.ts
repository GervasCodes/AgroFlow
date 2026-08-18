// Business logic for the "farms" domain. A Farm's owner is always the
// authenticated user who created it; ADMIN can read/update any farm,
// everyone else only their own. requireCapability("farm", "create"/...)
// (middleware/rbac.ts) checks the *action* is allowed for the role;
// this service additionally checks *ownership*, since RBAC alone can't
// express "a FARMER may edit their own farm but not someone else's".
import type { AuthenticatedUser } from "@agroflow/types";
import type { CreateFarmInput } from "@agroflow/validation";
import { farmRepository } from "../../repositories/index.js";
import { AppError } from "../../utils/AppError.js";

function assertOwnerOrAdmin(farm: { ownerId: string }, user: AuthenticatedUser) {
  if (farm.ownerId !== user.id && !user.roles.includes("ADMIN")) {
    throw AppError.forbidden("You can only manage your own farms");
  }
}

export function listMyFarms(user: AuthenticatedUser) {
  return farmRepository.findFarmsByOwner(user.id);
}

export async function createFarm(user: AuthenticatedUser, input: CreateFarmInput) {
  return farmRepository.createFarm({
    ownerId: user.id,
    name: input.name,
    regionId: input.regionId,
    district: input.district,
    ward: input.ward,
    village: input.village,
    sizeHectares: input.sizeHectares,
  });
}

export async function getFarmOrThrow(user: AuthenticatedUser, farmId: string) {
  const farm = await farmRepository.findFarmById(farmId);
  if (!farm) throw AppError.notFound("Farm not found");
  assertOwnerOrAdmin(farm, user);
  return farm;
}
