// Business logic for the "warehouses" domain. Same ownership pattern as
// services/farms: only the registering WAREHOUSE_MANAGER (or ADMIN) may
// update their own warehouse; anyone with warehouse:read may browse the
// full directory (e.g. a buyer or aggregator looking for storage near a
// region).
import type { AuthenticatedUser } from "@agroflow/types";
import type { CreateWarehouseInput } from "@agroflow/validation";
import { warehouseRepository } from "../../repositories/index.js";
import { AppError } from "../../utils/AppError.js";

export function listMyWarehouses(user: AuthenticatedUser) {
  return warehouseRepository.findWarehousesByOwner(user.id);
}

export function browseWarehouses(filters: { regionId?: string }) {
  return warehouseRepository.findAllWarehouses(filters);
}

export async function createWarehouse(user: AuthenticatedUser, input: CreateWarehouseInput) {
  return warehouseRepository.createWarehouse({
    ownerId: user.id,
    name: input.name,
    regionId: input.regionId,
    district: input.district,
    address: input.address,
    capacityTonnes: input.capacityTonnes,
  });
}

export async function updateUtilization(user: AuthenticatedUser, warehouseId: string, currentUtilization: number) {
  const warehouse = await warehouseRepository.findWarehouseById(warehouseId);
  if (!warehouse) throw AppError.notFound("Warehouse not found");
  if (warehouse.ownerId !== user.id && !user.roles.includes("ADMIN")) {
    throw AppError.forbidden("You can only update your own warehouses");
  }
  if (warehouse.capacityTonnes && currentUtilization > warehouse.capacityTonnes) {
    throw AppError.badRequest("Utilization cannot exceed capacity");
  }
  return warehouseRepository.updateUtilization(warehouseId, currentUtilization);
}
