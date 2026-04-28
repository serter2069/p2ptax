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

export async function sendNewMessageEmail(params: {
  toEmail: string;
  toName: string;
  fromName: string;
  threadId: string;
  requestTitle: string;
}): Promise<void> {
  if (!config.smtpUser) {
    // Dev mode: skip sending
    console.log(`[email] Would send to ${params.toEmail}: New message from ${params.fromName} in thread ${params.threadId}`);
    return;
  }

  const appUrl = process.env.APP_URL || "https://p2ptax.ru";
  const link = `${appUrl}/threads/${params.threadId}`;

  await transporter.sendMail({
    from: `"P2PTax" <${config.smtpFrom}>`,
    to: params.toEmail,
    subject: `Вам написал ${params.fromName} — P2PTax`,
    text: `Здравствуйте, ${params.toName}!\n\nВам написал ${params.fromName} по заявке «${params.requestTitle}».\n\nПрочитать сообщение: ${link}\n\nС уважением,\nP2PTax`,
    html: `<p>Здравствуйте, ${params.toName}!</p><p>Вам написал <strong>${params.fromName}</strong> по заявке «${params.requestTitle}».</p><p><a href="${link}">Прочитать сообщение</a></p><p>С уважением,<br>P2PTax</p>`,
  });
}
