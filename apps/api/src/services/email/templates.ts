// HTML templates for services/email's two current uses: an OTP code
// (services/auth's requestOtp) and a welcome email (services/auth's
// register). Kiswahili-first with an English gloss, matching the tone
// of channels/sms's notification templates. Kept as plain template
// strings, not a templating engine -- two emails don't need one.
function layout(bodyHtml: string): string {
  return `
    <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; background:#F7FAF5; padding:32px 16px;">
      <div style="max-width:480px; margin:0 auto; background:#FFFFFF; border-radius:16px; padding:32px; border:1px solid #E3ECE0;">
        <p style="font-size:20px; font-weight:700; color:#0F3D28; margin:0 0 20px;">AgroFlow</p>
        ${bodyHtml}
        <p style="font-size:12px; color:#6B7B6E; margin-top:32px;">
          AgroFlow &middot; Tanzania agricultural supply chain platform
        </p>
      </div>
    </div>
  `;
}

export function otpCodeEmail(code: string, expiresInMinutes: number): { subject: string; html: string } {
  return {
    subject: `${code} ndio nambari yako ya AgroFlow (your AgroFlow code)`,
    html: layout(`
      <p style="font-size:15px; color:#1B2E1F; margin:0 0 16px;">
        Tumia nambari hii kuingia AgroFlow (Use this code to sign in to AgroFlow):
      </p>
      <p style="font-size:32px; font-weight:700; letter-spacing:6px; color:#0F3D28; margin:0 0 16px; text-align:center;">
        ${code}
      </p>
      <p style="font-size:13px; color:#6B7B6E; margin:0;">
        Inaisha baada ya dakika ${expiresInMinutes} (expires in ${expiresInMinutes} minutes). Kama hukuomba nambari hii, puuza ujumbe huu (if you didn't request this, ignore this email).
      </p>
    `),
  };
}

export function welcomeEmail(fullName: string): { subject: string; html: string } {
  return {
    subject: "Karibu AgroFlow (Welcome to AgroFlow)",
    html: layout(`
      <p style="font-size:15px; color:#1B2E1F; margin:0 0 16px;">Habari ${fullName},</p>
      <p style="font-size:14px; color:#1B2E1F; margin:0 0 16px; line-height:1.6;">
        Karibu AgroFlow! Akaunti yako imesajiliwa. Fungua programu au tovuti ili kuomba jukumu lako
        (welcome -- your account is registered; open the app or site to request your role).
      </p>
    `),
  };
}
