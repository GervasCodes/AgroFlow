// Business logic for the Logistics domain. The Shipment side of
// Logistics was already fully built under services/shipments; what was
// still a stub here is the dispatch board view (an aggregate read over
// shipments, for TRANSPORTER/ADMIN dispatch screens -- see Phase 5's
// "Logistics/Dispatch board") and StorageBooking, which the Warehouse
// model's original comment explicitly deferred until Logistics had
// something to book warehouse capacity for.
import type { AuthenticatedUser } from "@agroflow/types";
import type { CreateStorageBookingInput } from "@agroflow/validation";
import { shipmentRepository, storageBookingRepository, warehouseRepository } from "../../repositories/index.js";
import { AppError } from "../../utils/AppError.js";

/** Unclaimed shipment jobs, for a transporter/admin dispatch board. */
export function getDispatchBoard() {
  return shipmentRepository.findAvailableShipments();
}

export async function createStorageBooking(user: AuthenticatedUser, input: CreateStorageBookingInput) {
  const warehouse = await warehouseRepository.findWarehouseById(input.warehouseId);
  if (!warehouse) throw AppError.notFound("Warehouse not found");

  if (input.endDate && input.endDate <= input.startDate) {
    throw AppError.badRequest("endDate must be after startDate");
  }

  return storageBookingRepository.createBooking({
    warehouseId: input.warehouseId,
    bookedById: user.id,
    purchaseOrderId: input.purchaseOrderId,
    quantityTonnes: input.quantityTonnes,
    startDate: input.startDate,
    endDate: input.endDate,
  });
}

export function listMyStorageBookings(userId: string) {
  return storageBookingRepository.findBookingsByUser(userId);
}

export async function listWarehouseBookings(user: AuthenticatedUser, warehouseId: string) {
  const warehouse = await warehouseRepository.findWarehouseById(warehouseId);
  if (!warehouse) throw AppError.notFound("Warehouse not found");
  if (warehouse.ownerId !== user.id && !user.roles.includes("ADMIN")) {
    throw AppError.forbidden("You do not manage this warehouse");
  }
  return storageBookingRepository.findBookingsByWarehouse(warehouseId);
}
