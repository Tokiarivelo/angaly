import { AppointmentResponseDto } from '../../application/dtos/appointment-response.dto';
import { AppointmentEntity } from '../../domain/entities/appointment.entity';
import type { AppointmentType as SharedAppointmentType, AppointmentStatus as SharedAppointmentStatus } from '@angaly/types';
import type { AppointmentRecord } from '../repositories/prisma-appointment.repository';

export class AppointmentMapper {
  static toDomain(record: AppointmentRecord): AppointmentEntity {
    return AppointmentEntity.create({
      id: record.id,
      reference: record.reference,
      customerId: record.customerId,
      firstName: record.firstName,
      lastName: record.lastName,
      phone: record.phone,
      email: record.email,
      type: record.type,
      atelierId: record.atelierId,
      assignedToId: record.assignedToId,
      scheduledAt: record.scheduledAt,
      durationMinutes: record.durationMinutes,
      status: record.status,
      message: record.message,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  static toResponseDto(entity: AppointmentEntity): AppointmentResponseDto {
    const dto = new AppointmentResponseDto();
    dto.id = entity.id;
    dto.reference = entity.reference;
    dto.customerId = entity.customerId;
    dto.firstName = entity.firstName;
    dto.lastName = entity.lastName;
    dto.phone = entity.phone;
    dto.email = entity.email;
    dto.type = entity.type as SharedAppointmentType;
    dto.atelierId = entity.atelierId;
    dto.assignedToId = entity.assignedToId;
    dto.scheduledAt = entity.scheduledAt.toISOString();
    dto.durationMinutes = entity.durationMinutes;
    dto.status = entity.status as SharedAppointmentStatus;
    dto.message = entity.message;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
