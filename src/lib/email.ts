import { Resend } from "resend";

const APP_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
const FROM = process.env.EMAIL_FROM ?? "FinTrack <noreply@fintrack.app>";

export async function sendVerificationEmail(email: string, token: string) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const url = `${APP_URL}/api/auth/verify-email?token=${token}`;

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Confirme seu e-mail — FinTrack",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;border-radius:8px">
        <h2 style="margin:0 0 8px;font-size:24px;font-weight:700">
          <span style="font-weight:400">Fin</span>Track
        </h2>
        <p style="color:#555;margin:0 0 24px">Confirme seu endereço de e-mail para ativar sua conta.</p>
        <a href="${url}"
           style="display:inline-block;background:#075056;color:#fff;text-decoration:none;
                  padding:12px 24px;border-radius:6px;font-weight:600;font-size:15px">
          Confirmar e-mail
        </a>
        <p style="color:#888;font-size:12px;margin:24px 0 0">
          Este link expira em 24 horas. Se você não criou uma conta no FinTrack, ignore este e-mail.
        </p>
      </div>
    `,
  });
}
