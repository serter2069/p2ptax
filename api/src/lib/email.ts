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
