// SMS service entry point. Two directions (Section 21):
//   - Outbound (primary purpose): POST /notify -- apps/api calls this
//     server-to-server after events (match approved, payment confirmed,
//     shipment delivered, ...) to dispatch a notification SMS.
//   - Inbound (secondary, stubbed): POST /sms/callback -- the real SMS
//     gateway's webhook for messages sent TO AgroFlow's shortcode.
//     Two-way flows (e.g. replying to confirm a match by SMS) are a
//     later addition; for now this just acknowledges receipt so the
//     endpoint exists and gateway configuration can be tested end to
//     end before the business logic behind it is built.
import "dotenv/config";
import express from "express";
import { requireInternalServiceSecret } from "./auth.js";
import {
  notifyOtpCode,
  notifyMatchProposed,
  notifyMatchApproved,
  notifyPaymentConfirmed,
  notifyShipmentDelivered,
  type OtpCodeData,
  type MatchProposedData,
  type MatchApprovedData,
  type PaymentConfirmedData,
  type ShipmentDeliveredData,
} from "./notifications.js";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => res.json({ status: "ok" }));

type NotifyBody =
  | { phoneNumber: string; type: "otp_code"; data: OtpCodeData }
  | { phoneNumber: string; type: "match_proposed"; data: MatchProposedData }
  | { phoneNumber: string; type: "match_approved"; data: MatchApprovedData }
  | { phoneNumber: string; type: "payment_confirmed"; data: PaymentConfirmedData }
  | { phoneNumber: string; type: "shipment_delivered"; data: ShipmentDeliveredData };

app.post("/notify", requireInternalServiceSecret, async (req, res) => {
  const body = req.body as NotifyBody;

  try {
    switch (body.type) {
      case "otp_code":
        await notifyOtpCode(body.phoneNumber, body.data);
        break;
      case "match_proposed":
        await notifyMatchProposed(body.phoneNumber, body.data);
        break;
      case "match_approved":
        await notifyMatchApproved(body.phoneNumber, body.data);
        break;
      case "payment_confirmed":
        await notifyPaymentConfirmed(body.phoneNumber, body.data);
        break;
      case "shipment_delivered":
        await notifyShipmentDelivered(body.phoneNumber, body.data);
        break;
      default:
        res.status(400).json({ error: "Unknown notification type" });
        return;
    }
    res.json({ sent: true });
  } catch (err) {
    console.error("Notification dispatch error:", err);
    res.status(500).json({ error: "Failed to send notification" });
  }
});

// Inbound webhook stub -- see file header comment.
app.post("/sms/callback", (req, res) => {
  console.log("[inbound SMS, stub handler]", req.body);
  res.type("text/plain").send("Asante. Tumia programu ya AgroFlow kwa huduma zaidi. (Thanks -- use the AgroFlow app for more.)");
});

const PORT = Number(process.env.PORT ?? 4200);
app.listen(PORT, () => {
  console.log(`AgroFlow SMS service listening on port ${PORT}`);
});
