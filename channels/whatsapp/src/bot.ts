// WhatsApp bot -- numbered-reply flows mirroring channels/ussd's menu
// tree (same "Sell Produce" flow working end to end; Prices/Orders/
// Payments/Help honestly stubbed "coming soon" for the same reason as
// USSD -- those domains have no read surface built for a channel to
// show yet). Unlike USSD, state lives in session.ts between messages
// rather than being derived from accumulated input each time.
import { CROPS } from "@agroflow/config";
import { channelApi, ChannelApiError } from "./apiClient.js";
import { getState, setState, resetState } from "./session.js";

const MAIN_MENU = [
  "Karibu AgroFlow! Chagua namba:",
  "1. Uza Mazao (Sell Produce)",
  "2. Bei za Soko (Prices) - soon",
  "3. Maagizo Yangu (Orders) - soon",
  "4. Msaada (Help) - soon",
  "",
  "Any time, reply 'menu' to start over.",
].join("\n");

function farmMenu(farms: { id: string; name: string }[]): string {
  return ["Chagua shamba / Select farm:", ...farms.map((f, i) => `${i + 1}. ${f.name}`)].join("\n");
}

function cropMenu(): string {
  return [
    "Chagua zao / Select crop:",
    ...CROPS.map((c, i) => `${i + 1}. ${c.charAt(0) + c.slice(1).toLowerCase()}`),
  ].join("\n");
}

/** Processes one inbound message and returns the reply text. */
export async function handleMessage(senderId: string, rawText: string): Promise<string> {
  const text = rawText.trim();

  if (text.toLowerCase() === "menu") {
    resetState(senderId);
    return MAIN_MENU;
  }

  const state = getState(senderId);

  switch (state.step) {
    case "MAIN_MENU": {
      if (text !== "1") return "Kipengele hiki kinakuja hivi karibuni. Reply 'menu' to go back.";

      try {
        const farms = await channelApi.listFarms(senderId);
        if (farms.length === 0) {
          return "Huna shamba lililosajiliwa. Ongeza shamba kwenye programu ya AgroFlow kwanza.";
        }
        setState(senderId, { step: "SELL_CHOOSE_FARM", farms });
        return farmMenu(farms);
      } catch (err) {
        return err instanceof ChannelApiError ? err.message : "Hitilafu. Jaribu tena baadaye.";
      }
    }

    case "SELL_CHOOSE_FARM": {
      const farms = state.farms ?? [];
      const farm = farms[Number(text) - 1];
      if (!farm) return "Chaguo si sahihi. Jaribu tena, au andika 'menu' kuanza upya.";

      setState(senderId, { step: "SELL_CHOOSE_CROP", farmId: farm.id });
      return cropMenu();
    }

    case "SELL_CHOOSE_CROP": {
      const crop = CROPS[Number(text) - 1];
      if (!crop) return "Chaguo si sahihi. Jaribu tena, au andika 'menu' kuanza upya.";

      setState(senderId, { step: "SELL_ENTER_QUANTITY", crop });
      return "Weka kiasi kwa kilo / Enter quantity in kg:";
    }

    case "SELL_ENTER_QUANTITY": {
      const quantity = Number(text);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        return "Kiasi si sahihi. Jaribu tena (mfano: 150).";
      }

      setState(senderId, { step: "SELL_CONFIRM", quantity });
      return [
        `Thibitisha / Confirm: ${quantity}kg ${state.crop}?`,
        "1. Ndiyo / Yes",
        "2. Hapana / No",
      ].join("\n");
    }

    case "SELL_CONFIRM": {
      const proceed = text === "1";
      const { farmId, crop, quantity } = state;
      resetState(senderId);

      if (!proceed) return "Umeghairi. Andika 'menu' kuanza upya.";
      if (!farmId || !crop || !quantity) return "Hitilafu. Andika 'menu' kuanza upya.";

      try {
        const result = await channelApi.sell({ phoneNumber: senderId, farmId, crop, quantity });
        return `Tangazo limechapishwa: ${result.quantity}kg ${result.crop}. Asante!`;
      } catch (err) {
        return err instanceof ChannelApiError ? err.message : "Hitilafu. Jaribu tena baadaye.";
      }
    }

    default:
      resetState(senderId);
      return MAIN_MENU;
  }
}
