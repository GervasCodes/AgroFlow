// Data-access layer -- wraps Prisma client calls. Services call
// repositories, never Prisma directly, so data-access patterns stay
// consistent and testable.
export * as userRepository from "./user.repository.js";
export type { UserWithRoles } from "./user.repository.js";
export * as roleRepository from "./role.repository.js";
export * as roleRequestRepository from "./role-request.repository.js";
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
export * as paymentTransactionRepository from "./payment-transaction.repository.js";
export * as reviewRepository from "./review.repository.js";
export * as disputeRepository from "./dispute.repository.js";
export * as trustScoreRepository from "./trust-score.repository.js";
export * as inventoryRepository from "./inventory.repository.js";
export * as storageBookingRepository from "./storage-booking.repository.js";
export * as analyticsRepository from "./analytics.repository.js";
export * as notificationLogRepository from "./notification-log.repository.js";
