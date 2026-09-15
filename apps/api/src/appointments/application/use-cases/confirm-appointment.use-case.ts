import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';

import { CUSTOMER_REPOSITORY, ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import { CreateNotificationUseCase } from '../../../notifications/application/use-cases/create-notification.use-case';
import { AppointmentEntity } from '../../domain/entities/appointment.entity';
import { APPOINTMENT_REPOSITORY, IAppointmentRepository } from '../../domain/repositories/appointment.repository';

@Injectable()
export class ConfirmAppointmentUseCase {
  private readonly logger = new Logger(ConfirmAppointmentUseCase.name);

  constructor(
    @Inject(APPOINTMENT_REPOSITORY) private readonly appointmentRepository: IAppointmentRepository,
    @Inject(CUSTOMER_REPOSITORY) private readonly customerRepository: ICustomerRepository,
    private readonly createNotificationUseCase: CreateNotificationUseCase,
  ) {}

  async execute(reference: string, assignedToId: string): Promise<AppointmentEntity> {
    const appointment = await this.appointmentRepository.findByReference(reference);
    if (!appointment) {
      throw new NotFoundException(`Appointment "${reference}" not found`);
    }
    if (appointment.status !== 'PENDING') {
      throw new BadRequestException(`Only a PENDING appointment can be confirmed (current status: "${appointment.status}")`);
    }

    const confirmed = await this.appointmentRepository.updateStatus(appointment.id, 'CONFIRMED', assignedToId);
    await this.notifyConfirmed(confirmed);
    return confirmed;
  }

  /**
   * Best-effort, and only for a connected customer — an anonymous visitor
   * booking (no `Customer` linked) has no `User` to attach an in-app
   * `Notification` to; that gap is tracked in
   * `docs/features/appointments.md` "Points d'attention" until email-only
   * delivery to `appointment.email` is designed.
   */
  private async notifyConfirmed(appointment: AppointmentEntity): Promise<void> {
    if (!appointment.customerId) return;

    try {
      const customer = await this.customerRepository.findById(appointment.customerId);
      if (!customer) return;

      await this.createNotificationUseCase.execute({
        userId: customer.userId,
        type: 'APPOINTMENT_CONFIRMED',
        title: 'Rendez-vous confirmé',
        body: `Votre rendez-vous du ${appointment.scheduledAt.toLocaleDateString('fr-FR')} est confirmé.`,
        relatedEntityType: 'Appointment',
        relatedEntityId: appointment.id,
      });
    } catch (error) {
      this.logger.warn(`Failed to emit APPOINTMENT_CONFIRMED for appointment ${appointment.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
