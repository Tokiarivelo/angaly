import { Inject, Injectable, Logger } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';

import { IUserRepository, USER_REPOSITORY } from '../../../auth/domain/repositories/user.repository';
import { INotificationChannelPort } from '../../domain/ports/notification-channel.port';
import { NotificationEntity } from '../../domain/entities/notification.entity';

/**
 * SMTP-based email channel — provider-agnostic on purpose (spec §84 does not
 * pin a specific transactional-email vendor, see `docs/features/notifications.md`
 * "Points d'attention"): any SMTP-compatible provider (SendGrid, Mailgun, AWS
 * SES, a self-hosted relay…) works by pointing `SMTP_*` env vars at it.
 *
 * `SMTP_HOST` unset means email is not configured for this environment (e.g.
 * local dev without a mail relay) — `send()` then logs and returns instead of
 * throwing, consistent with the channel's best-effort contract.
 */
@Injectable()
export class EmailChannelAdapter implements INotificationChannelPort {
  readonly name = 'email';

  private readonly logger = new Logger(EmailChannelAdapter.name);
  private transporter: Transporter | null = null;

  constructor(@Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository) {}

  async send(notification: NotificationEntity): Promise<void> {
    const transporter = this.getTransporter();
    if (!transporter) {
      this.logger.debug(`SMTP not configured — skipping email for notification ${notification.id}`);
      return;
    }

    const user = await this.userRepository.findById(notification.userId);
    if (!user) {
      this.logger.warn(`Cannot email notification ${notification.id}: user ${notification.userId} not found`);
      return;
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? 'ANGALY <no-reply@angaly.mg>',
      to: user.email,
      subject: notification.title,
      text: notification.body,
    });
  }

  private getTransporter(): Transporter | null {
    if (this.transporter) return this.transporter;

    const host = process.env.SMTP_HOST;
    if (!host) return null;

    this.transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
    });
    return this.transporter;
  }
}
