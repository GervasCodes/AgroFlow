// Outbound transactional email -- provider is Brevo. Two ways to reach
// it, tried in order:
//   1. Brevo's REST API (BREVO_API_KEY) -- preferred: works from hosts
//      that block outbound SMTP ports (common on free/starter tiers),
//      and gives per-message delivery status back in the response.
//   2. Brevo's SMTP relay (SMTP_HOST/PORT/USER/PASSWORD) -- the
//      original integration; kept working for anyone already set up
//      this way, or for a non-Brevo SMTP-compatible provider.
// Neither configured -> logs instead of sending, same "log in dev, real
// send once configured" pattern as every other integration here.
import nodemailer from "nodemailer";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

function defaultFrom(): { name: string; email: string } {
  const raw = process.env.SMTP_FROM ?? "AgroFlow <no-reply@agroflow.example>";
  const match = raw.match(/^(.*?)\s*<(.+)>$/);
  return match ? { name: match[1]!.trim(), email: match[2]!.trim() } : { name: "AgroFlow", email: raw.trim() };
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  /** Plain-text fallback. Auto-derived from html (tags stripped) if omitted. */
  text?: string;
}

async function sendViaBrevoApi(input: SendEmailInput, apiKey: string): Promise<void> {
  const from = defaultFrom();
  const res = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: from,
      to: [{ email: input.to }],
      subject: input.subject,
      htmlContent: input.html,
      textContent: input.text ?? input.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    }),
  });

  if (!res.ok) {
    throw new Error(`Brevo API send failed (${res.status}): ${await res.text()}`);
  }
}

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getSmtpTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) return null;

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // Brevo: STARTTLS on 587 (secure:false), SSL on 465 (secure:true)
    auth: { user, pass },
  });
  return transporter;
}

async function sendViaSmtp(input: SendEmailInput): Promise<boolean> {
  const client = getSmtpTransporter();
  if (!client) return false;

  const from = process.env.SMTP_FROM ?? "AgroFlow <no-reply@agroflow.example>";
  await client.sendMail({ from, to: input.to, subject: input.subject, html: input.html, text: input.text });
  return true;
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;

  if (apiKey) {
    await sendViaBrevoApi(input, apiKey);
    return;
  }

  if (await sendViaSmtp(input)) return;

  console.log(`[dev-only, Brevo not configured] Email to ${input.to} -- ${input.subject}`);
}
