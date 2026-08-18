// Offline write queue + conflict resolution. Flushes to the API when
// connectivity returns. Phase 6 covers produce-listing creation, the
// highest-value offline case (Section 20); the fuller SQLite-backed
// offline *read* store (farms/orders/prices cached for browsing with
// no signal) is a separate, larger addition for a later phase.
export {
  enqueueListing,
  flushQueue,
  getQueueSize,
  subscribeToConnectivity,
  type QueuedListing,
} from "./offlineQueue";
