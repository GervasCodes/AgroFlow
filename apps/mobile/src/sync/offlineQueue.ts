// Offline write queue -- Section 20 sync engine, scoped to the writes
// that plausibly happen at the edge of signal: a farmer listing produce
// (Phase 6's original case), an aggregator filing a quality inspection
// on a collection run, and a transporter updating shipment status
// mid-delivery. All three share one AsyncStorage-backed queue, flushed
// to the API automatically whenever connectivity returns (and manually
// via flushQueue() as a fallback).
//
// Buyer and Warehouse Manager screens do NOT enqueue offline writes:
// both roles' actions (approving a match, booking storage) are
// desk/warehouse-context operations, not out-in-the-field ones, so
// they're built online-first and simply show a clear error if the
// request fails rather than silently queuing something time-sensitive
// (a match approval, in particular, has other parties waiting on it --
// queuing it invisibly could look like it went through when it didn't).
//
// This is intentionally a plain AsyncStorage queue rather than the full
// SQLite offline store described in src/database's scaffold comment --
// that store (mirroring farm/order/price data for offline *reading*) is
// a bigger piece added once those read-heavy screens exist. This queue
// only covers offline *writes*.
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import type { CreateProduceListingInput, CreateQualityInspectionInput, UpdateShipmentStatusInput } from "@agroflow/validation";
import { apiClient } from "@/services/apiClient";

const QUEUE_KEY = "agroflow.offlineQueue.v2";
const LEGACY_QUEUE_KEY = "agroflow.offlineQueue.produceListings"; // pre-Phase-6 key, produce listings only

type QueuedEntry =
  | { localId: string; queuedAt: string; type: "produce_listing"; input: CreateProduceListingInput }
  | { localId: string; queuedAt: string; type: "quality_inspection"; input: CreateQualityInspectionInput }
  | {
      localId: string;
      queuedAt: string;
      type: "shipment_status_update";
      input: { shipmentId: string; status: UpdateShipmentStatusInput };
    };

/** @deprecated kept for the type name existing code imports; prefer QueuedEntry. */
export type QueuedListing = Extract<QueuedEntry, { type: "produce_listing" }>;

async function writeQueue(queue: QueuedEntry[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

async function readQueue(): Promise<QueuedEntry[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (raw) return JSON.parse(raw) as QueuedEntry[];

  // One-time migration: a listing queued by an older build (before this
  // queue supported multiple write types) must not silently vanish.
  const legacyRaw = await AsyncStorage.getItem(LEGACY_QUEUE_KEY);
  if (!legacyRaw) return [];
  const legacy = JSON.parse(legacyRaw) as { localId: string; input: CreateProduceListingInput; queuedAt: string }[];
  const migrated: QueuedEntry[] = legacy.map((l) => ({ ...l, type: "produce_listing" as const }));
  await writeQueue(migrated);
  await AsyncStorage.removeItem(LEGACY_QUEUE_KEY);
  return migrated;
}

function makeLocalId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function enqueue(entry: QueuedEntry): Promise<QueuedEntry> {
  const queue = await readQueue();
  await writeQueue([...queue, entry]);
  return entry;
}

export async function enqueueListing(input: CreateProduceListingInput) {
  return enqueue({ localId: makeLocalId(), queuedAt: new Date().toISOString(), type: "produce_listing", input });
}

export async function enqueueQualityInspection(input: CreateQualityInspectionInput) {
  return enqueue({ localId: makeLocalId(), queuedAt: new Date().toISOString(), type: "quality_inspection", input });
}

export async function enqueueShipmentStatusUpdate(shipmentId: string, status: UpdateShipmentStatusInput) {
  return enqueue({
    localId: makeLocalId(),
    queuedAt: new Date().toISOString(),
    type: "shipment_status_update",
    input: { shipmentId, status },
  });
}

export async function getQueueSize(): Promise<number> {
  return (await readQueue()).length;
}

async function sendOne(entry: QueuedEntry): Promise<void> {
  switch (entry.type) {
    case "produce_listing":
      await apiClient.produceListings.create(entry.input);
      return;
    case "quality_inspection":
      await apiClient.qualityInspections.create(entry.input);
      return;
    case "shipment_status_update":
      await apiClient.shipments.updateStatus(entry.input.shipmentId, entry.input.status);
      return;
  }
}

/** Sends every queued write to the API, in order, removing each on
 * success. Stops and keeps the remainder queued on the first failure
 * (e.g. connectivity dropped again mid-flush) -- writes of different
 * types can sit in the same queue and are sent in the order they were
 * made. */
export async function flushQueue(): Promise<{ sent: number; remaining: number }> {
  const queue = await readQueue();
  let sent = 0;

  while (queue.length > 0) {
    const next = queue[0]!;
    try {
      await sendOne(next);
      queue.shift();
      sent += 1;
      await writeQueue(queue);
    } catch {
      break; // leave the rest queued, try again on the next connectivity event
    }
  }

  return { sent, remaining: queue.length };
}

/** Call once at app launch (see app/_layout.tsx) to auto-flush whenever
 * the device regains connectivity. */
export function subscribeToConnectivity(onFlushed?: (result: { sent: number; remaining: number }) => void) {
  return NetInfo.addEventListener((state) => {
    if (state.isConnected && state.isInternetReachable !== false) {
      flushQueue().then((result) => {
        if (result.sent > 0) onFlushed?.(result);
      });
    }
  });
}
