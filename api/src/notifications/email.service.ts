import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (process.env.SMTP_HOST) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT ?? '587', 10),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      this.logger.warn('SMTP_HOST not set — running in dev mode, emails will be logged only');
    }
  }

  /** Notify client that a specialist responded to their request */
  notifyNewResponse(clientEmail: string, requestId: string, specialistId: string): void {
    if (!process.env.SMTP_HOST) {
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
    if (!process.env.SMTP_HOST) {
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

    if (!process.env.SMTP_HOST) {
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

  private async send(opts: { to: string; subject: string; text: string }): Promise<void> {
    if (!this.transporter) return;

    await this.transporter.sendMail({
      from: process.env.SMTP_USER,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
    });
  }
}
