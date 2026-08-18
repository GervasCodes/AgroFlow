// Business logic for the "demand" (DemandOrder) domain. A demand order
// can only be read/managed by the buyer who created it (or ADMIN) --
// same ownership pattern as services/farms and services/produce.
import type { AuthenticatedUser } from "@agroflow/types";
import type { CreateDemandOrderInput } from "@agroflow/validation";
import { cropRepository, demandOrderRepository } from "../../repositories/index.js";
import { AppError } from "../../utils/AppError.js";

export function listMyDemandOrders(user: AuthenticatedUser) {
  return demandOrderRepository.findDemandOrdersByBuyer(user.id);
}

export async function createDemandOrder(user: AuthenticatedUser, input: CreateDemandOrderInput) {
  const crop = await cropRepository.findCropByName(input.crop);
  if (!crop) throw AppError.badRequest(`Unknown crop: ${input.crop}`);

  return demandOrderRepository.createDemandOrder({
    buyerId: user.id,
    cropId: crop.id,
    quantity: input.quantity,
    unit: input.unit,
    qualityGrade: input.qualityGrade,
    maxPricePerUnit: input.maxPricePerUnit,
    regionId: input.regionId,
    neededBy: new Date(input.neededBy),
  });
}

export async function getDemandOrderOrThrow(user: AuthenticatedUser, id: string) {
  const order = await demandOrderRepository.findDemandOrderById(id);
  if (!order) throw AppError.notFound("Demand order not found");
  if (order.buyerId !== user.id && !user.roles.includes("ADMIN")) {
    throw AppError.forbidden("You can only manage your own demand orders");
  }
  return order;
}
