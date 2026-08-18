// Mobile money provider adapters (M-Pesa, Mixx by Yas, Airtel Money,
// HaloPesa). Every adapter implements one shared interface: initiate,
// verify-webhook, reconcile. Idempotency keys and webhook signature
// verification are mandatory (Section 18/24) -- do not skip these.
export {};
