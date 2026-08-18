// USSD menu tree (dial *XXX#). Phase 7 implements menu 1 (Sell Produce)
// fully, end to end, against the real API -- proving the pattern every
// other channel (and later USSD menus 2-6) will reuse. Menus 2-6 are
// stubbed with an honest "coming soon" END rather than faked data,
// since their domains (Marketplace matching, cached prices, orders,
// payments, agent directory) don't exist server-side yet.
//
// Every screen is a single request/response with the caller's ENTIRE
// input history in `text` (e.g. "1*2*3*150") -- this is the standard
// Africa's Talking-style USSD gateway contract, the most common
// integration pattern for Tanzanian telcos. We derive the current step
// from how many `*`-separated selections have been made, and lean on
// session.ts to remember the farm list a numbered selection points into.
import { CROPS } from "@agroflow/config";
import { channelApi, ChannelApiError } from "./apiClient.js";
import { endSession, getSession, updateSession } from "./session.js";

export interface UssdRequest {
  sessionId: string;
  phoneNumber: string;
  text: string; // accumulated input, e.g. "" | "1" | "1*2" | "1*2*150" | "1*2*150*1"
}

const MAIN_MENU = [
  "CON Karibu AgroFlow",
  "1. Uza Mazao (Sell Produce)",
  "2. Bei za Soko (Prices) - soon",
  "3. Maagizo Yangu (Orders) - soon",
  "4. Msaada (Help) - soon",
].join("\n");

function cropMenu(): string {
  const lines = CROPS.map((c, i) => `${i + 1}. ${c.charAt(0) + c.slice(1).toLowerCase()}`);
  return ["CON Chagua zao / Select crop:", ...lines].join("\n");
}

function farmMenu(farms: { id: string; name: string }[]): string {
  const lines = farms.map((f, i) => `${i + 1}. ${f.name}`);
  return ["CON Chagua shamba / Select farm:", ...lines].join("\n");
}

export async function handleUssdRequest({ sessionId, phoneNumber, text }: UssdRequest): Promise<string> {
  const steps = text === "" ? [] : text.split("*");

  // Step 0: main menu.
  if (steps.length === 0) return MAIN_MENU;

  // Only menu 1 (Sell Produce) is wired up this phase.
  if (steps[0] !== "1") {
    endSession(sessionId);
    return "END Kipengele hiki kinakuja hivi karibuni. / This feature is coming soon.";
  }

  // Step 1: "1" -- show the farmer's farms.
  if (steps.length === 1) {
    try {
      const farms = await channelApi.listFarms(phoneNumber);
      if (farms.length === 0) {
        endSession(sessionId);
        return "END Huna shamba lililosajiliwa. Ongeza shamba kwenye programu ya AgroFlow kwanza.";
      }
      updateSession(sessionId, { farms });
      return farmMenu(farms);
    } catch (err) {
      endSession(sessionId);
      return `END ${err instanceof ChannelApiError ? err.message : "Hitilafu. Jaribu tena baadaye."}`;
    }
  }

  // Step 2: "1*<farmIndex>" -- resolve the chosen farm, show crop list.
  if (steps.length === 2) {
    const farms = getSession(sessionId).farms ?? [];
    const index = Number(steps[1]) - 1;
    const farm = farms[index];
    if (!farm) return "END Chaguo si sahihi. Anza tena. / Invalid choice. Please start again.";

    updateSession(sessionId, { farmId: farm.id });
    return cropMenu();
  }

  // Step 3: "1*<farmIndex>*<cropIndex>" -- resolve crop, ask quantity.
  if (steps.length === 3) {
    const cropIndex = Number(steps[2]) - 1;
    const crop = CROPS[cropIndex];
    if (!crop) return "END Chaguo si sahihi. Anza tena. / Invalid choice. Please start again.";

    updateSession(sessionId, { crop });
    return "CON Weka kiasi kwa kilo / Enter quantity in kg:";
  }

  // Step 4: "...*<quantity>" -- confirm before submitting.
  if (steps.length === 4) {
    const quantity = Number(steps[3]);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return "END Kiasi si sahihi. Anza tena. / Invalid quantity. Please start again.";
    }

    const ctx = getSession(sessionId);
    updateSession(sessionId, { quantity });
    return [
      "CON Thibitisha / Confirm:",
      `${quantity}kg ${ctx.crop}`,
      "1. Ndiyo / Yes",
      "2. Hapana / No",
    ].join("\n");
  }

  // Step 5: "...*1" confirm, or "...*2" cancel.
  if (steps.length === 5) {
    const choice = steps[4];
    const ctx = getSession(sessionId);
    endSession(sessionId);

    if (choice !== "1") return "END Umeghairi. / Cancelled.";
    if (!ctx.farmId || !ctx.crop || !ctx.quantity) {
      return "END Hitilafu. Anza tena. / Something went wrong. Please start again.";
    }

    try {
      const result = await channelApi.sell({
        phoneNumber,
        farmId: ctx.farmId,
        crop: ctx.crop,
        quantity: ctx.quantity,
      });
      return `END Tangazo limechapishwa: ${result.quantity}kg ${result.crop}. Asante!`;
    } catch (err) {
      return `END ${err instanceof ChannelApiError ? err.message : "Hitilafu. Jaribu tena baadaye."}`;
    }
  }

  endSession(sessionId);
  return "END Kipindi kimeisha. Anza tena. / Session ended. Please start again.";
}
