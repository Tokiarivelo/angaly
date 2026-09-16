import { Inject, Injectable } from '@nestjs/common';

import type { UserRole } from '../../../auth/domain/entities/user.entity';
import { CUSTOMER_REPOSITORY, ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import { AppointmentEntity } from '../../domain/entities/appointment.entity';
import { APPOINTMENT_REPOSITORY, IAppointmentRepository } from '../../domain/repositories/appointment.repository';
import { resolveCustomerId } from '../lib/resolve-customer-id';

const STAFF_ROLES: UserRole[] = ['MANAGER', 'ADMIN'];

/** `CLIENT` sees their own appointments; `MANAGER`/`ADMIN` see every appointment. Mirrors `orders`' `ListCustomerOrdersUseCase`. */
@Injectable()
export class ListMyAppointmentsUseCase {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY) private readonly appointmentRepository: IAppointmentRepository,
    @Inject(CUSTOMER_REPOSITORY) private readonly customerRepository: ICustomerRepository,
  ) {}

  async execute(userId: string, role: UserRole): Promise<AppointmentEntity[]> {
    if (STAFF_ROLES.includes(role)) {
      return this.appointmentRepository.findAll();
    }

    const customerId = await resolveCustomerId(this.customerRepository, userId);
    return this.appointmentRepository.findByCustomerId(customerId);
  }
}
