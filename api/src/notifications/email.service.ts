import { Injectable, Logger } from '@nestjs/common';
import { BrevoClient } from '@getbrevo/brevo';

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

  /** Notify client that a specialist responded to their request */
  notifyNewResponse(clientEmail: string, requestId: string, specialistId: string): void {
    if (!this.client) {
      this.logger.log(
        `DEV EMAIL [notifyNewResponse]: to=${clientEmail} requestId=${requestId} specialistId=${specialistId}`,
      );
      return;
    }

    this.send({
      to: clientEmail,
      subject: 'Новый отклик на ваш запрос — Налоговик',
      text:
        `На ваш запрос #${requestId} поступил новый отклик от специалиста.\n\n` +
        `Откройте приложение, чтобы ознакомиться с предложением и связаться со специалистом.`,
    }).catch((err) => this.logger.error('[notifyNewResponse] send failed', err));
  }

  /** Notify recipient that they have a new chat message */
  notifyNewMessage(recipientEmail: string, senderEmail: string, threadId: string): void {
    if (!this.client) {
      this.logger.log(
        `DEV EMAIL [notifyNewMessage]: to=${recipientEmail} from=${senderEmail} threadId=${threadId}`,
      );
      return;
    }

    this.send({
      to: recipientEmail,
      subject: 'Новое сообщение — Налоговик',
      text:
        `Вам пришло новое сообщение от ${senderEmail}.\n\n` +
        `Откройте приложение, чтобы ответить.`,
    }).catch((err) => this.logger.error('[notifyNewMessage] send failed', err));
  }

  /** Notify a list of specialists that a new request appeared in their city */
  notifyNewRequestInCity(
    specialistEmails: string[],
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

    for (const email of specialistEmails) {
      this.send({
        to: email,
        subject: `Новый запрос в городе ${requestCity} — Налоговик`,
        text,
      }).catch((err) =>
        this.logger.error(`[notifyNewRequestInCity] send failed to ${email}`, err),
      );
    }
  }

  /** Notify specialist that their promotion expires in 3 days */
  async notifyPromotionExpiringSoon(specialistEmail: string, city: string): Promise<void> {
    if (!this.client) {
      this.logger.log(`[DEV] Promotion expiry reminder → ${specialistEmail} for city ${city}`);
      return;
    }
    await this.send({
      to: specialistEmail,
      subject: 'Продвижение истекает через 3 дня',
      text: `Ваше продвижение в городе ${city} истекает через 3 дня.\n\nОбратитесь через чат для продления.`,
    });
  }

  /** Send a one-time password to the user */
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

  private async send(opts: { to: string; subject: string; text: string }): Promise<void> {
    if (!this.client) return;

    await this.client.transactionalEmails.sendTransacEmail({
      sender: { email: this.senderEmail, name: this.senderName },
      to: [{ email: opts.to }],
      subject: opts.subject,
      textContent: opts.text,
    });
  }
}
