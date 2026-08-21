// Business logic for the Aggregation domain: an AGGREGATOR (or
// WAREHOUSE_MANAGER) consolidating produce from multiple listings into a
// bulk Inventory lot, optionally held at a Warehouse they don't
// necessarily own (booking that space is services/logistics's job).
import type { AuthenticatedUser } from "@agroflow/types";
import type { CreateInventoryInput, UpdateInventoryInput } from "@agroflow/validation";
import { cropRepository, inventoryRepository, warehouseRepository } from "../../repositories/index.js";
import { AppError } from "../../utils/AppError.js";

export async function createInventoryLot(user: AuthenticatedUser, input: CreateInventoryInput) {
  const crop = await cropRepository.findCropByName(input.crop);
  if (!crop) throw AppError.badRequest(`Unknown crop: ${input.crop}`);

  if (input.warehouseId) {
    const warehouse = await warehouseRepository.findWarehouseById(input.warehouseId);
    if (!warehouse) throw AppError.notFound("Warehouse not found");
  }

  return inventoryRepository.createInventory({
    ownerId: user.id,
    cropId: crop.id,
    quantity: input.quantity,
    unit: input.unit,
    warehouseId: input.warehouseId,
  });
}

export function listMyInventory(userId: string) {
  return inventoryRepository.findInventoryByOwner(userId);
}

async function getOwnedLotOrThrow(user: AuthenticatedUser, inventoryId: string) {
  const lot = await inventoryRepository.findInventoryById(inventoryId);
  if (!lot) throw AppError.notFound("Inventory lot not found");
  if (lot.ownerId !== user.id && !user.roles.includes("ADMIN")) {
    throw AppError.forbidden("You do not own this inventory lot");
  }
  return lot;
}

export async function updateInventoryQuantity(
  user: AuthenticatedUser,
  inventoryId: string,
  input: UpdateInventoryInput,
) {
  await getOwnedLotOrThrow(user, inventoryId);
  return inventoryRepository.updateInventoryQuantity(inventoryId, input.quantity);
}
