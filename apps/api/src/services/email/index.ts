// Outbound transactional email. Same "log in dev, real send once
// configured" pattern as channels/sms and services/payments -- if
// SMTP_HOST is unset, sendEmail() logs instead of sending. Designed
// against Brevo's SMTP relay (see .env.example): SMTP_HOST=smtp-relay.
// brevo.com, SMTP_PORT=587, SMTP_USER=<Brevo login>, SMTP_PASSWORD=
// <Brevo SMTP key -- NOT the account password>. Any other SMTP-
// compatible provider works too by changing SMTP_HOST/PORT.
import nodemailer from "nodemailer";

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
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

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const client = getTransporter();
  const from = process.env.SMTP_FROM ?? "AgroFlow <no-reply@agroflow.example>";

  if (!client) {
    console.log(`[dev-only, SMTP not configured] Email to ${input.to} -- ${input.subject}`);
    return;
  }

  await client.sendMail({ from, to: input.to, subject: input.subject, html: input.html });
}
