// USSD service entry point -- calls the same apps/api services as every
// other channel (Sell Produce hits the same produce service the mobile
// app and web use, via the trusted-channel surface in
// apps/api/src/routes/channels.routes.ts). Deployable separately from
// the main API per its package.json description -- this is a thin,
// stateless-per-request Express app, not a copy of the API.
import "dotenv/config";
import express from "express";
import { handleUssdRequest } from "./menu-tree.js";

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Africa's Talking-style USSD callback contract: gateway POSTs
// sessionId/phoneNumber/text (form-encoded or JSON depending on
// gateway config), expects a plain-text CON/END response.
app.post("/ussd/callback", async (req, res) => {
  const sessionId = String(req.body.sessionId ?? "");
  const phoneNumber = String(req.body.phoneNumber ?? "");
  const text = String(req.body.text ?? "");

  if (!sessionId || !phoneNumber) {
    res.status(400).type("text/plain").send("END Ombi si sahihi. / Invalid request.");
    return;
  }

  try {
    const response = await handleUssdRequest({ sessionId, phoneNumber, text });
    res.type("text/plain").send(response);
  } catch (err) {
    console.error("USSD callback error:", err);
    res.type("text/plain").send("END Hitilafu ya mfumo. Jaribu tena baadaye. / System error. Try again later.");
  }
});

const PORT = Number(process.env.PORT ?? 4100);
app.listen(PORT, () => {
  console.log(`AgroFlow USSD service listening on port ${PORT}`);
});
