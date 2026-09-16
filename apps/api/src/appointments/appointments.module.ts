import { Module } from '@nestjs/common';

import { AteliersModule } from '../ateliers/ateliers.module';
import { AuthModule } from '../auth/auth.module';
import { CustomersModule } from '../customers/customers.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CancelAppointmentUseCase } from './application/use-cases/cancel-appointment.use-case';
import { ConfirmAppointmentUseCase } from './application/use-cases/confirm-appointment.use-case';
import { CreateAppointmentUseCase } from './application/use-cases/create-appointment.use-case';
import { GetAppointmentByReferenceUseCase } from './application/use-cases/get-appointment-by-reference.use-case';
import { GetDaySlotsUseCase } from './application/use-cases/get-day-slots.use-case';
import { GetMonthAvailabilityUseCase } from './application/use-cases/get-month-availability.use-case';
import { ListMyAppointmentsUseCase } from './application/use-cases/list-my-appointments.use-case';
import { APPOINTMENT_REPOSITORY } from './domain/repositories/appointment.repository';
import { PrismaAppointmentRepository } from './infrastructure/repositories/prisma-appointment.repository';
import { AppointmentsController } from './presentation/controllers/appointments.controller';

@Module({
  // AteliersModule: ATELIER_REPOSITORY (opening hours for availability calculation).
  // CustomersModule: CUSTOMER_REPOSITORY (links a connected CLIENT's Customer, resolved again by confirm-appointment for notifying).
  // AuthModule: JwtAuthGuard/RolesGuard (confirm-appointment, staff-only) + ACCESS_TOKEN_SERVICE (optional auth on create).
  // NotificationsModule: CreateNotificationUseCase (confirm-appointment emits APPOINTMENT_CONFIRMED).
  imports: [AteliersModule, CustomersModule, AuthModule, NotificationsModule],
  controllers: [AppointmentsController],
  providers: [
    GetMonthAvailabilityUseCase,
    GetDaySlotsUseCase,
    CreateAppointmentUseCase,
    GetAppointmentByReferenceUseCase,
    CancelAppointmentUseCase,
    ConfirmAppointmentUseCase,
    ListMyAppointmentsUseCase,
    { provide: APPOINTMENT_REPOSITORY, useClass: PrismaAppointmentRepository },
  ],
})
export class AppointmentsModule {}
