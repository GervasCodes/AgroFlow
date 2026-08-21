// Mounts all route modules under /api/v1 (see Section 22 for the full
// list) plus /channels/ussd, /channels/sms, /channels/whatsapp (wired in
// the channels phase).
import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { roleRequestsRouter } from "./role-requests.routes.js";
import { testRouter } from "./test.routes.js";
import { farmsRouter } from "./farms.routes.js";
import { produceRouter } from "./produce.routes.js";
import { channelsRouter } from "./channels.routes.js";
import { demandRouter } from "./demand.routes.js";
import { matchesRouter } from "./matches.routes.js";
import { purchaseOrdersRouter } from "./purchase-orders.routes.js";
import { qualityRouter } from "./quality.routes.js";
import { shipmentsRouter } from "./shipments.routes.js";
import { warehousesRouter } from "./warehouses.routes.js";
import { paymentsRouter } from "./payments.routes.js";
import { reviewsRouter, disputesRouter } from "./trust.routes.js";
import { logisticsRouter } from "./logistics.routes.js";
import { aggregationRouter } from "./aggregation.routes.js";
import { analyticsRouter } from "./analytics.routes.js";
import { aiRouter } from "./ai.routes.js";
import { notificationsRouter } from "./notifications.routes.js";
import { usersRouter } from "./users.routes.js";

export const apiRouter : Router = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/role-requests", roleRequestsRouter);
apiRouter.use("/farms", farmsRouter);
apiRouter.use("/produce-listings", produceRouter);
apiRouter.use("/channels", channelsRouter);
apiRouter.use("/demand-orders", demandRouter);
apiRouter.use("/matches", matchesRouter);
apiRouter.use("/purchase-orders", purchaseOrdersRouter);
apiRouter.use("/quality-inspections", qualityRouter);
apiRouter.use("/shipments", shipmentsRouter);
apiRouter.use("/warehouses", warehousesRouter);
apiRouter.use("/payments", paymentsRouter);
apiRouter.use("/reviews", reviewsRouter);
apiRouter.use("/disputes", disputesRouter);
apiRouter.use("/logistics", logisticsRouter);
apiRouter.use("/inventory", aggregationRouter);
apiRouter.use("/analytics", analyticsRouter);
apiRouter.use("/ai", aiRouter);
apiRouter.use("/notifications", notificationsRouter);
apiRouter.use("/users", usersRouter);

// Verification-only routes for the RBAC gate -- never mounted in production.
if (process.env.NODE_ENV !== "production") {
  apiRouter.use("/test", testRouter);
}
