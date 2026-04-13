import { Injectable, Logger } from '@nestjs/common';
import { BrevoClient } from '@getbrevo/brevo';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private client: BrevoClient | null = null;
  private senderEmail = 'no-reply@nalogovic.ru';
  private senderName = 'Налоговик';

  constructor() {
    const apiKey = process.env.BREVO_API_KEY;
    if (apiKey) {
      this.client = new BrevoClient({ apiKey });
      this.senderEmail = process.env.BREVO_SENDER_EMAIL || this.senderEmail;
      this.senderName = process.env.BREVO_SENDER_NAME || this.senderName;
    } else {
      this.logger.warn('BREVO_API_KEY not set — running in dev mode, emails will be logged only');
    }
  }

  /** Generate a short-lived JWT (7 days) for one-click unsubscribe */
  generateUnsubscribeToken(userId: string): string {
    return jwt.sign(
      { sub: userId, purpose: 'unsubscribe' },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' },
    );
  }

  /** Build the unsubscribe URL for a given user */
  private getUnsubscribeUrl(userId: string): string {
    const baseUrl = process.env.APP_URL || 'https://p2ptax.smartlaunchhub.com';
    const token = this.generateUnsubscribeToken(userId);
    return `${baseUrl}/api/users/unsubscribe?token=${token}`;
  }

  /** Build HTML email body with unsubscribe footer */
  private wrapWithFooter(htmlBody: string, userId: string): string {
    const unsubscribeUrl = this.getUnsubscribeUrl(userId);
    return `
<!DOCTYPE html>
<html lang="ru">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;">
  <tr><td style="padding:24px 32px;">
    ${htmlBody}
  </td></tr>
  <tr><td style="padding:16px 32px;border-top:1px solid #e0e0e0;text-align:center;">
    <p style="margin:0;font-size:12px;color:#888888;">
      Вы получили это письмо, потому что подписаны на уведомления Налоговик.
      <br>
      <a href="${unsubscribeUrl}" style="color:#4A90D9;text-decoration:underline;">Отписаться от уведомлений</a>
    </p>
  </td></tr>
</table>
</body>
</html>`;
  }

  /** Build plain-text footer with unsubscribe link */
  private appendTextFooter(text: string, userId: string): string {
    const unsubscribeUrl = this.getUnsubscribeUrl(userId);
    return (
      text +
      `\n\n---\nВы получили это письмо, потому что подписаны на уведомления Налоговик.\n` +
      `Отписаться: ${unsubscribeUrl}`
    );
  }

  /** Notify client that a specialist responded to their request */
  notifyNewResponse(clientEmail: string, requestId: string, specialistId: string, userId: string): void {
    if (!this.client) {
      this.logger.log(
        `DEV EMAIL [notifyNewResponse]: to=${clientEmail} requestId=${requestId} specialistId=${specialistId}`,
      );
      return;
    }

    const text =
      `На ваш запрос #${requestId} поступил новый отклик от специалиста.\n\n` +
      `Откройте приложение, чтобы ознакомиться с предложением и связаться со специалистом.`;

    const html = `
      <p>На ваш запрос <strong>#${requestId}</strong> поступил новый отклик от специалиста.</p>
      <p>Откройте приложение, чтобы ознакомиться с предложением и связаться со специалистом.</p>`;

    this.send({
      to: clientEmail,
      subject: 'Новый отклик на ваш запрос — Налоговик',
      text,
      html,
      userId,
    }).catch((err) => this.logger.error('[notifyNewResponse] send failed', err));
  }

  /** Notify recipient that they have a new chat message */
  notifyNewMessage(recipientEmail: string, senderEmail: string, threadId: string, userId: string): void {
    if (!this.client) {
      this.logger.log(
        `DEV EMAIL [notifyNewMessage]: to=${recipientEmail} from=${senderEmail} threadId=${threadId}`,
      );
      return;
    }

    const text =
      `Вам пришло новое сообщение от ${senderEmail}.\n\n` +
      `Откройте приложение, чтобы ответить.`;

    const html = `
      <p>Вам пришло новое сообщение от <strong>${senderEmail}</strong>.</p>
      <p>Откройте приложение, чтобы ответить.</p>`;

    this.send({
      to: recipientEmail,
      subject: 'Новое сообщение — Налоговик',
      text,
      html,
      userId,
    }).catch((err) => this.logger.error('[notifyNewMessage] send failed', err));
  }

  /** Notify specialist that their response was accepted by the client */
  notifyResponseAccepted(specialistEmail: string, clientName: string, requestTitle: string, userId: string): void {
    if (!this.client) {
      this.logger.log(
        `DEV EMAIL [notifyResponseAccepted]: to=${specialistEmail} client=${clientName} request=${requestTitle}`,
      );
      return;
    }

    const text =
      `Ваш отклик принят клиентом ${clientName}.\n\n` +
      `Напишите ему.`;

    const html = `
      <p>Ваш отклик на запрос <strong>${requestTitle}</strong> принят клиентом <strong>${clientName}</strong>.</p>
      <p>Напишите ему.</p>`;

    this.send({
      to: specialistEmail,
      subject: 'Ваш отклик принят — Налоговик',
      text,
      html,
      userId,
    }).catch((err) => this.logger.error('[notifyResponseAccepted] send failed', err));
  }

  /** Notify a list of specialists that a new request appeared in their city */
  notifyNewRequestInCity(
    specialistEmails: string[],
    specialistUserIds: string[],
    requestCity: string,
    requestDescription: string,
  ): void {
    if (specialistEmails.length === 0) return;

    if (!this.client) {
      this.logger.log(
        `DEV EMAIL [notifyNewRequestInCity]: to=[${specialistEmails.join(', ')}] city=${requestCity}`,
      );
      return;
    }

    const text =
      `В городе ${requestCity} появился новый запрос клиента:\n\n` +
      `"${requestDescription.slice(0, 200)}${requestDescription.length > 200 ? '…' : ''}"\n\n` +
      `Откройте приложение, чтобы откликнуться.`;

    const html = `
      <p>В городе <strong>${requestCity}</strong> появился новый запрос клиента:</p>
      <blockquote style="border-left:3px solid #ccc;padding-left:12px;color:#555;">
        ${requestDescription.slice(0, 200)}${requestDescription.length > 200 ? '…' : ''}
      </blockquote>
      <p>Откройте приложение, чтобы откликнуться.</p>`;

    for (let i = 0; i < specialistEmails.length; i++) {
      this.send({
        to: specialistEmails[i],
        subject: `Новый запрос в городе ${requestCity} — Налоговик`,
        text,
        html,
        userId: specialistUserIds[i],
      }).catch((err) =>
        this.logger.error(`[notifyNewRequestInCity] send failed to ${specialistEmails[i]}`, err),
      );
    }
  }

  /** Notify specialist that their promotion expires in 3 days */
  async notifyPromotionExpiringSoon(specialistEmail: string, city: string, userId: string): Promise<void> {
    if (!this.client) {
      this.logger.log(`[DEV] Promotion expiry reminder → ${specialistEmail} for city ${city}`);
      return;
    }

    const text = `Ваше продвижение в городе ${city} истекает через 3 дня.\n\nОбратитесь через чат для продления.`;

    const html = `
      <p>Ваше продвижение в городе <strong>${city}</strong> истекает через 3 дня.</p>
      <p>Обратитесь через чат для продления.</p>`;

    await this.send({
      to: specialistEmail,
      subject: 'Продвижение истекает через 3 дня',
      text,
      html,
      userId,
    });
  }

  /** Notify client that their request will be auto-closed soon */
  notifyRequestClosingSoon(clientEmail: string, requestId: string, userId: string): void {
    if (!this.client) {
      this.logger.log(
        `DEV EMAIL [notifyRequestClosingSoon]: to=${clientEmail} requestId=${requestId}`,
      );
      return;
    }

    const text =
      `Ваш запрос #${requestId} будет автоматически закрыт через 3 дня из-за отсутствия активности.\n\n` +
      `Если запрос ещё актуален, продлите его через приложение.`;

    const html = `
      <p>Ваш запрос <strong>#${requestId}</strong> будет автоматически закрыт через 3 дня из-за отсутствия активности.</p>
      <p>Если запрос ещё актуален, продлите его через приложение.</p>`;

    this.send({
      to: clientEmail,
      subject: 'Запрос будет закрыт через 3 дня — Налоговик',
      text,
      html,
      userId,
    }).catch((err) => this.logger.error('[notifyRequestClosingSoon] send failed', err));
  }

  /** Send a one-time password to the user (no unsubscribe footer — transactional email) */
  async sendOtp(email: string, code: string): Promise<void> {
    if (!this.client) {
      this.logger.log(`[DEV] OTP for ${email}: ${code} (Brevo not configured, email not sent)`);
      return;
    }

    try {
      await this.client.transactionalEmails.sendTransacEmail({
        sender: { email: this.senderEmail, name: this.senderName },
        to: [{ email }],
        subject: 'Ваш код для входа — Налоговик',
        textContent: `Ваш код для входа: ${code}\n\nКод действителен 10 минут. Если вы не запрашивали код, проигнорируйте это письмо.`,
        htmlContent: `<p>Ваш код для входа в <b>Налоговик</b>:</p><h2 style="letter-spacing:4px">${code}</h2><p>Код действителен 10 минут.</p>`,
      });
      this.logger.log(`OTP email sent via Brevo to ${email}`);
    } catch (err) {
      this.logger.error(`[sendOtp] Failed to send OTP email to ${email}`, err);
    }
  }

  private async send(opts: { to: string; subject: string; text: string; html: string; userId: string }): Promise<void> {
    if (!this.client) return;

    await this.client.transactionalEmails.sendTransacEmail({
      sender: { email: this.senderEmail, name: this.senderName },
      to: [{ email: opts.to }],
      subject: opts.subject,
      textContent: this.appendTextFooter(opts.text, opts.userId),
      htmlContent: this.wrapWithFooter(opts.html, opts.userId),
    });
  }
}
