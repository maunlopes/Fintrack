import { Resend } from "resend";

const APP_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
const FROM = process.env.EMAIL_FROM ?? "PQGASTEI? <noreply@pqgastei.com>";

// ---------------------------------------------------------------------------
// Shared email wrapper — responsive, branded, works on all email clients
// ---------------------------------------------------------------------------
function emailLayout(content: string) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>PQGASTEI?</title>
  <!--[if mso]>
  <style>table,td{font-family:Arial,sans-serif!important}</style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased">
  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5">
    <tr>
      <td align="center" style="padding:40px 16px">
        <!-- Inner card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">

          <!-- Header with logo -->
          <tr>
            <td style="padding:32px 32px 0;text-align:center">
              <a href="${APP_URL}" target="_blank" style="text-decoration:none">
                <img src="${APP_URL}/logos/logo-light.svg" alt="PQGASTEI?" width="168" height="44" style="display:inline-block;height:44px;width:auto;max-width:168px" />
              </a>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:24px 32px 0">
              <div style="height:1px;background-color:#e5e7eb"></div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:24px 32px 32px">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb">
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;line-height:1.5">
                Este e-mail foi enviado por <a href="${APP_URL}" style="color:#19D45E;text-decoration:none;font-weight:600">PQGASTEI?</a>
                <br />Gestão financeira pessoal
              </p>
              <p style="margin:8px 0 0;font-size:11px;color:#d1d5db;text-align:center">
                Se você não reconhece esta ação, ignore este e-mail com segurança.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Reusable CTA button
// ---------------------------------------------------------------------------
function ctaButton(text: string, href: string) {
  return `
    <!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${href}" style="height:48px;width:280px;v-text-anchor:middle" arcsize="14%" fillcolor="#19D45E" stroke="f">
      <center style="color:#111827;font-family:sans-serif;font-size:16px;font-weight:bold">${text}</center>
    </v:roundrect>
    <![endif]-->
    <!--[if !mso]><!-->
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto">
      <tr>
        <td style="border-radius:8px;background-color:#19D45E;text-align:center">
          <a href="${href}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#111827;text-decoration:none;border-radius:8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
            ${text}
          </a>
        </td>
      </tr>
    </table>
    <!--<![endif]-->`;
}

// ---------------------------------------------------------------------------
// Email: Verificação de conta
// ---------------------------------------------------------------------------
export async function sendVerificationEmail(email: string, token: string) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const url = `${APP_URL}/api/auth/verify-email?token=${token}`;

  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
      Confirme seu e-mail
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6">
      Olá! Você criou uma conta no <strong style="color:#111827">PQGASTEI?</strong>.
      Para ativar sua conta e começar a organizar suas finanças, confirme seu e-mail clicando no botão abaixo.
    </p>
    ${ctaButton("Confirmar meu e-mail", url)}
    <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;line-height:1.5">
      Este link expira em <strong>24 horas</strong>. Se o botão não funcionar, copie e cole este link no navegador:
    </p>
    <p style="margin:8px 0 0;font-size:12px;color:#19D45E;word-break:break-all">
      <a href="${url}" style="color:#19D45E;text-decoration:none">${url}</a>
    </p>`;

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Confirme seu e-mail — PQGASTEI?",
    html: emailLayout(content),
  });
}

// ---------------------------------------------------------------------------
// Email: Redefinição de senha
// ---------------------------------------------------------------------------
export async function sendPasswordResetEmail(email: string, token: string) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const url = `${APP_URL}/auth/reset-password?token=${token}`;

  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
      Redefinir sua senha
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6">
      Recebemos uma solicitação para redefinir a senha da sua conta no <strong style="color:#111827">PQGASTEI?</strong>.
      Clique no botão abaixo para criar uma nova senha.
    </p>
    ${ctaButton("Redefinir minha senha", url)}
    <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;line-height:1.5">
      Este link expira em <strong>1 hora</strong>. Se o botão não funcionar, copie e cole este link no navegador:
    </p>
    <p style="margin:8px 0 0;font-size:12px;color:#19D45E;word-break:break-all">
      <a href="${url}" style="color:#19D45E;text-decoration:none">${url}</a>
    </p>`;

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Redefinir senha — PQGASTEI?",
    html: emailLayout(content),
  });
}
