// Data-access layer -- wraps Prisma client calls. Services call
// repositories, never Prisma directly, so data-access patterns stay
// consistent and testable.
export * as userRepository from "./user.repository.js";
export type { UserWithRoles } from "./user.repository.js";
export * as roleRepository from "./role.repository.js";
export * as otpRepository from "./otp.repository.js";
export * as refreshTokenRepository from "./refresh-token.repository.js";
export * as farmRepository from "./farm.repository.js";
export * as cropRepository from "./crop.repository.js";
export * as produceListingRepository from "./produce-listing.repository.js";
export * as demandOrderRepository from "./demand-order.repository.js";
export * as matchRepository from "./match.repository.js";
export * as purchaseOrderRepository from "./purchase-order.repository.js";
export * as qualityInspectionRepository from "./quality-inspection.repository.js";
export * as shipmentRepository from "./shipment.repository.js";
export * as warehouseRepository from "./warehouse.repository.js";
export * as paymentRepository from "./payment.repository.js";
