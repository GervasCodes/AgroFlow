// Offline write queue for the "Sell Produce" flow (Section 20 sync
// engine, scoped down for this phase to its single most important
// case: a farmer creating a produce listing with no signal). Persisted
// to AsyncStorage as JSON; flushed to the API automatically whenever
// connectivity returns, and manually via flushQueue() as a fallback.
//
// This is intentionally a plain AsyncStorage queue rather than the full
// SQLite offline store described in src/database's scaffold comment --
// that store (mirroring farm/order/price data for offline *reading*) is
// a bigger piece added once those read-heavy screens exist. This queue
// only covers offline *writes* for produce listings.
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import type { CreateProduceListingInput } from "@agroflow/validation";
import { apiClient } from "@/services/apiClient";

const QUEUE_KEY = "agroflow.offlineQueue.produceListings";

export interface QueuedListing {
  localId: string;
  input: CreateProduceListingInput;
  queuedAt: string;
}

async function readQueue(): Promise<QueuedListing[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? (JSON.parse(raw) as QueuedListing[]) : [];
}

async function writeQueue(queue: QueuedListing[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function enqueueListing(input: CreateProduceListingInput): Promise<QueuedListing> {
  const queue = await readQueue();
  const entry: QueuedListing = {
    localId: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    input,
    queuedAt: new Date().toISOString(),
  };
  await writeQueue([...queue, entry]);
  return entry;
}

export async function getQueueSize(): Promise<number> {
  return (await readQueue()).length;
}

/** Sends every queued listing to the API, in order, removing each on
 * success. Stops and keeps the remainder queued on the first failure
 * (e.g. connectivity dropped again mid-flush). */
export async function flushQueue(): Promise<{ sent: number; remaining: number }> {
  const queue = await readQueue();
  let sent = 0;

  while (queue.length > 0) {
    const next = queue[0]!;
    try {
      await apiClient.produceListings.create(next.input);
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
