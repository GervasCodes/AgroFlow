// Business logic for the "purchase-orders" domain. Phase 8 scope is
// read-only -- a PurchaseOrder is only ever created as a side effect of
// services/matches's approveMatch(). Status transitions (CONFIRMED ->
// IN_FULFILLMENT -> DELIVERED -> PAID) are added once the Logistics and
// Finance domains exist to drive them.
import type { AuthenticatedUser } from "@agroflow/types";
import { purchaseOrderRepository } from "../../repositories/index.js";

export function listAsBuyer(user: AuthenticatedUser) {
  return purchaseOrderRepository.findPurchaseOrdersForBuyer(user.id);
}

export function listAsSeller(user: AuthenticatedUser) {
  return purchaseOrderRepository.findPurchaseOrdersForSeller(user.id);
}
