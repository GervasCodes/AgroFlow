// WhatsApp Business API (Meta Cloud API) webhook receiver + bot.
// Two Meta-specific things this file handles that USSD/SMS don't need:
//   - GET /webhook: the one-time verification handshake Meta requires
//     when you register a webhook URL (echoes back hub.challenge if
//     hub.verify_token matches).
//   - POST /webhook: Meta's actual event payload shape is deeply
//     nested (entry[].changes[].value.messages[]) -- extractInboundText
//     below unwraps it to a plain (senderId, text) pair for bot.ts.
import "dotenv/config";
import express from "express";
import { handleMessage } from "./bot.js";
import { sendWhatsAppMessage, registerWebhookSubscription } from "./gateway.js";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    res.status(200).send(String(challenge));
  } else {
    res.sendStatus(403);
  }
});

interface WhatsAppWebhookBody {
  entry?: {
    changes?: {
      value?: {
        messages?: { from: string; text?: { body: string } }[];
      };
    }[];
  }[];
}

function extractInboundMessages(body: WhatsAppWebhookBody): { senderId: string; text: string }[] {
  const messages: { senderId: string; text: string }[] = [];
  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const msg of change.value?.messages ?? []) {
        if (msg.text?.body) messages.push({ senderId: msg.from, text: msg.text.body });
      }
    }
  }
  return messages;
}

app.post("/webhook", async (req, res) => {
  // Meta expects a fast 200 regardless of processing outcome, or it
  // will retry aggressively -- acknowledge immediately, process after.
  res.sendStatus(200);

  const messages = extractInboundMessages(req.body as WhatsAppWebhookBody);
  for (const { senderId, text } of messages) {
    try {
      const reply = await handleMessage(senderId, text);
      await sendWhatsAppMessage(senderId, reply);
    } catch (err) {
      console.error("WhatsApp message handling error:", err);
    }
  }
});

const PORT = Number(process.env.PORT ?? 4300);
app.listen(PORT, () => {
  console.log(`AgroFlow WhatsApp service listening on port ${PORT}`);
  // Best-effort, non-blocking -- a failed subscription call shouldn't
  // stop the service from starting (the GET /webhook handshake and
  // outbound sending still work independently of it).
  registerWebhookSubscription().catch((err) => console.error("Webhook subscription registration failed:", err));
});
