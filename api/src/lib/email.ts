import nodemailer from "nodemailer";
import { config } from "./config";

const transporter = nodemailer.createTransport({
  host: config.smtpHost || "smtp.gmail.com",
  port: config.smtpPort,
  secure: config.smtpSecure,
  auth: {
    user: config.smtpUser,
    pass: config.smtpPass,
  },
});

// In-memory throttle: key = `${threadId}:${recipientId}`, value = timestamp of last email
const emailThrottle = new Map<string, number>();
const EMAIL_THROTTLE_MS = 30 * 60 * 1000; // 30 minutes

export async function sendNewMessageEmail(params: {
  toEmail: string;
  toName: string;
  fromName: string;
  threadId: string;
  requestTitle: string;
  recipientId: string;
}): Promise<void> {
  const throttleKey = `${params.threadId}:${params.recipientId}`;
  const lastSent = emailThrottle.get(throttleKey);
  const now = Date.now();

  if (lastSent && now - lastSent < EMAIL_THROTTLE_MS) {
    // Already sent recently — skip
    return;
  }

  emailThrottle.set(throttleKey, now);

  const appUrl = process.env.APP_URL || "https://p2ptax.ru";
  const link = `${appUrl}/requests/${params.threadId}/messages`;

  if (!config.smtpUser) {
    // Dev mode: skip sending
    console.log(`[email] Would send to ${params.toEmail}: New message from ${params.fromName} in thread ${params.threadId} (throttle: ${EMAIL_THROTTLE_MS / 60000}min)`);
    return;
  }

  await transporter.sendMail({
    from: `"P2PTax" <${config.smtpFrom}>`,
    to: params.toEmail,
    subject: `Вам написал ${params.fromName} — P2PTax`,
    text: `Здравствуйте, ${params.toName}!\n\nВам написал ${params.fromName} по запросу «${params.requestTitle}».\n\nПрочитать сообщение: ${link}\n\nС уважением,\nP2PTax`,
    html: `<p>Здравствуйте, ${params.toName}!</p><p>Вам написал <strong>${params.fromName}</strong> по запросу «${params.requestTitle}».</p><p><a href="${link}">Прочитать сообщение</a></p><p>С уважением,<br>P2PTax</p>`,
  });
}

/**
 * Notify a specialist that a new client request appeared on one of
 * the FNS offices in their work area. Body intentionally does NOT
 * include the request text — just the FNS name + a link — so VIP
 * vs non-VIP differs only in delivery latency, not content.
 */
export async function sendNewRequestForFnsEmail(params: {
  toEmail: string;
  toName: string;
  fnsName: string;
  cityName: string;
  requestId: string;
  isVip: boolean;
}): Promise<void> {
  const appUrl = process.env.APP_URL || "https://p2ptax.smartlaunchhub.com";
  const link = `${appUrl}/requests/${params.requestId}/detail`;
  const vipBadge = params.isVip ? " (VIP)" : "";

  if (!config.smtpUser) {
    console.log(
      `[email] Would notify ${params.toEmail}: new request on ${params.fnsName}${vipBadge}`
    );
    return;
  }

  await transporter.sendMail({
    from: `"P2PTax" <${config.smtpFrom}>`,
    to: params.toEmail,
    subject: `Новый запрос по ${params.fnsName}${vipBadge} — P2PTax`,
    text:
      `Здравствуйте, ${params.toName}!\n\n` +
      `Появился новый запрос от клиента по ${params.fnsName} (${params.cityName}).\n` +
      `Откройте, чтобы откликнуться: ${link}\n\n` +
      `С уважением,\nP2PTax`,
    html:
      `<p>Здравствуйте, ${params.toName}!</p>` +
      `<p>Появился новый запрос от клиента по <strong>${params.fnsName}</strong> (${params.cityName}).</p>` +
      `<p><a href="${link}">Открыть запрос</a></p>` +
      `<p>С уважением,<br>P2PTax</p>`,
  });
}

/**
 * Tell a specialist their daily VIP autopay was rejected. All their
 * VIP-FNS toggles have been deactivated and they need to update the
 * card before they can re-subscribe.
 */
export async function sendVipChargeFailedEmail(params: {
  toEmail: string;
  toName: string;
  amountRub: number;
}): Promise<void> {
  const appUrl = process.env.APP_URL || "https://p2ptax.smartlaunchhub.com";
  const link = `${appUrl}/profile?tab=billing`;

  if (!config.smtpUser) {
    console.log(
      `[email] Would notify ${params.toEmail}: vip charge failed (${params.amountRub} ₽)`
    );
    return;
  }

  await transporter.sendMail({
    from: `"P2PTax" <${config.smtpFrom}>`,
    to: params.toEmail,
    subject: `Не удалось списать ${params.amountRub} ₽ за VIP — P2PTax`,
    text:
      `Здравствуйте, ${params.toName}!\n\n` +
      `Сегодня не удалось списать ${params.amountRub} ₽ за подписку VIP по ИФНС.\n` +
      `Все ваши VIP-подписки приостановлены до тех пор, пока вы не привяжете действующую карту.\n\n` +
      `Открыть страницу оплаты: ${link}\n\n` +
      `С уважением,\nP2PTax`,
    html:
      `<p>Здравствуйте, ${params.toName}!</p>` +
      `<p>Сегодня не удалось списать <strong>${params.amountRub} ₽</strong> за подписку VIP по ИФНС.</p>` +
      `<p>Все ваши VIP-подписки приостановлены до тех пор, пока вы не привяжете действующую карту.</p>` +
      `<p><a href="${link}">Открыть страницу оплаты</a></p>` +
      `<p>С уважением,<br>P2PTax</p>`,
  });
}
