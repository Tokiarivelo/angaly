import { UserEntity } from '../../../auth/domain/entities/user.entity';
import type { IUserRepository } from '../../../auth/domain/repositories/user.repository';
import { NotificationEntity } from '../../domain/entities/notification.entity';
import { EmailChannelAdapter } from '../../infrastructure/services/email-channel.adapter';

const sendMail = jest.fn().mockResolvedValue(undefined);
const createTransport = jest.fn((_options?: unknown) => ({ sendMail }));

jest.mock('nodemailer', () => ({
  __esModule: true,
  default: { createTransport: (options: unknown) => createTransport(options) },
}));

function sampleUser(): UserEntity {
  return UserEntity.create({
    id: 'user-1',
    email: 'client@example.com',
    passwordHash: 'hash',
    role: 'CLIENT',
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function sampleNotification(): NotificationEntity {
  return NotificationEntity.create({
    id: 'notif-1',
    userId: 'user-1',
    type: 'ORDER_STATUS_CHANGED',
    title: 'Statut mis à jour',
    body: 'Votre commande a changé de statut.',
    isRead: false,
    relatedEntityType: null,
    relatedEntityId: null,
    createdAt: new Date(),
  });
}

function buildUserRepository(user: UserEntity | null): jest.Mocked<IUserRepository> {
  return {
    findByEmail: jest.fn(),
    findById: jest.fn().mockResolvedValue(user),
    createWithCustomer: jest.fn(),
    updateLastLoginAt: jest.fn(),
    updatePasswordHash: jest.fn(),
  };
}

describe('EmailChannelAdapter', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('skips sending when SMTP_HOST is not configured', async () => {
    delete process.env.SMTP_HOST;
    const userRepository = buildUserRepository(sampleUser());
    const adapter = new EmailChannelAdapter(userRepository);

    await adapter.send(sampleNotification());

    expect(createTransport).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('sends an email to the notification owner when SMTP is configured', async () => {
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_FROM = 'ANGALY <no-reply@angaly.mg>';
    const userRepository = buildUserRepository(sampleUser());
    const adapter = new EmailChannelAdapter(userRepository);

    await adapter.send(sampleNotification());

    expect(createTransport).toHaveBeenCalledWith(expect.objectContaining({ host: 'smtp.example.com' }));
    expect(sendMail).toHaveBeenCalledWith({
      from: 'ANGALY <no-reply@angaly.mg>',
      to: 'client@example.com',
      subject: 'Statut mis à jour',
      text: 'Votre commande a changé de statut.',
    });
  });

  it('does nothing when the notification owner cannot be found', async () => {
    process.env.SMTP_HOST = 'smtp.example.com';
    const userRepository = buildUserRepository(null);
    const adapter = new EmailChannelAdapter(userRepository);

    await adapter.send(sampleNotification());

    expect(sendMail).not.toHaveBeenCalled();
  });

  it('reuses the transporter across multiple sends', async () => {
    process.env.SMTP_HOST = 'smtp.example.com';
    const userRepository = buildUserRepository(sampleUser());
    const adapter = new EmailChannelAdapter(userRepository);

    await adapter.send(sampleNotification());
    await adapter.send(sampleNotification());

    expect(createTransport).toHaveBeenCalledTimes(1);
  });
});
