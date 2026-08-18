// Business logic for the "shipments" domain -- modeled as a lightweight
// job board: the buyer on a PurchaseOrder requests a shipment, any
// TRANSPORTER can claim an unclaimed one (assigning themselves), and
// only the assigned transporter (or ADMIN) can move it through
// IN_TRANSIT -> DELIVERED, or cancel it. Ownership here is two-sided
// and changes over the shipment's lifecycle -- unlike farms/listings
// (fixed owner) it starts owned by the buyer and gains a second owner
// (the transporter) upon claim.
import type { AuthenticatedUser } from "@agroflow/types";
import type { RequestShipmentInput, UpdateShipmentStatusInput } from "@agroflow/validation";
import { purchaseOrderRepository, shipmentRepository, userRepository } from "../../repositories/index.js";
import { AppError } from "../../utils/AppError.js";
import { notify } from "../notifications/index.js";

export function listAvailable() {
  return shipmentRepository.findAvailableShipments();
}

export function listAsBuyer(user: AuthenticatedUser) {
  return shipmentRepository.findShipmentsForBuyer(user.id);
}

export function listAsTransporter(user: AuthenticatedUser) {
  return shipmentRepository.findShipmentsForTransporter(user.id);
}

export async function requestShipment(user: AuthenticatedUser, input: RequestShipmentInput) {
  const order = await purchaseOrderRepository.findPurchaseOrderById(input.purchaseOrderId);
  if (!order) throw AppError.notFound("Purchase order not found");
  if (order.buyerId !== user.id && !user.roles.includes("ADMIN")) {
    throw AppError.forbidden("You can only request shipment for your own purchase orders");
  }

  const existing = await shipmentRepository.findShipmentByPurchaseOrder(input.purchaseOrderId);
  if (existing) throw AppError.conflict("This purchase order already has a shipment");

  return shipmentRepository.createShipment({
    purchaseOrderId: input.purchaseOrderId,
    deliveryLocation: input.deliveryLocation,
  });
}

export async function claimShipment(user: AuthenticatedUser, shipmentId: string) {
  const shipment = await shipmentRepository.findShipmentById(shipmentId);
  if (!shipment) throw AppError.notFound("Shipment not found");
  if (shipment.status !== "PENDING_PICKUP" || shipment.transporterId) {
    throw AppError.conflict("This shipment has already been claimed");
  }
  return shipmentRepository.assignTransporter(shipmentId, user.id);
}

export async function updateShipmentStatus(
  user: AuthenticatedUser,
  shipmentId: string,
  input: UpdateShipmentStatusInput,
) {
  const shipment = await shipmentRepository.findShipmentById(shipmentId);
  if (!shipment) throw AppError.notFound("Shipment not found");
  if (shipment.transporterId !== user.id && !user.roles.includes("ADMIN")) {
    throw AppError.forbidden("You can only update shipments assigned to you");
  }
  if (shipment.status === "DELIVERED" || shipment.status === "CANCELLED") {
    throw AppError.conflict(`Shipment is already ${shipment.status.toLowerCase()}`);
  }

  const extra =
    input.status === "IN_TRANSIT"
      ? { pickedUpAt: new Date() }
      : input.status === "DELIVERED"
        ? { deliveredAt: new Date() }
        : {};

  const updated = await shipmentRepository.updateStatus(shipmentId, input.status, extra);

  if (input.status === "DELIVERED") {
    const buyer = await userRepository.findUserById(updated.purchaseOrder.buyerId);
    if (buyer) {
      notify({
        phoneNumber: buyer.phoneNumber,
        type: "shipment_delivered",
        data: { deliveryLocation: updated.deliveryLocation },
      });
    }
  }

  return updated;
}
