// SQLite offline store -- mirrors the subset of server data needed for
// offline-capable *reading* (browsing farms/orders/prices with no
// signal -- Section 20). Deferred past Phase 6: that phase's offline
// need was writes (creating a produce listing with no signal), which
// src/sync/offlineQueue.ts covers with a simpler AsyncStorage queue.
// Build this out once a read-heavy offline screen actually needs it.
export {};
