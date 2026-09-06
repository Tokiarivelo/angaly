import { AtelierResponseDto } from '../../application/dtos/atelier-response.dto';
import { AtelierEntity } from '../../domain/entities/atelier.entity';
import { parseOpeningHours } from '../../domain/value-objects/opening-hours.vo';
import { parseServices } from '../../domain/value-objects/services.vo';
import type { AtelierRecord } from '../repositories/prisma-atelier.repository';

export class AtelierMapper {
  static toDomain(record: AtelierRecord): AtelierEntity {
    return AtelierEntity.create({
      id: record.id,
      slug: record.slug,
      name: record.name,
      address: record.address,
      city: record.city,
      phone: record.phone,
      openingHours: parseOpeningHours(record.openingHoursJson),
      services: parseServices(record.servicesJson),
      latitude: record.latitude,
      longitude: record.longitude,
      media: record.media.map((media) => ({ ...media, altText: media.altText ?? '' })),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  static toResponseDto(entity: AtelierEntity): AtelierResponseDto {
    const dto = new AtelierResponseDto();
    dto.id = entity.id;
    dto.slug = entity.slug;
    dto.name = entity.name;
    dto.address = entity.address;
    dto.city = entity.city;
    dto.phone = entity.phone;
    dto.openingHours = entity.openingHours;
    dto.services = entity.services;
    dto.latitude = entity.latitude;
    dto.longitude = entity.longitude;
    dto.media = entity.media;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
