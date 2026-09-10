import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import { ACCESS_TOKEN_SERVICE, AccessTokenPayload, IAccessTokenService } from '../../../auth/domain/services/access-token.service';
import { AppointmentResponseDto } from '../../application/dtos/appointment-response.dto';
import { MonthAvailabilityDayResponseDto } from '../../application/dtos/availability-response.dto';
import { CreateAppointmentDto } from '../../application/dtos/create-appointment.dto';
import { GetDaySlotsQueryDto } from '../../application/dtos/get-day-slots-query.dto';
import { GetMonthAvailabilityQueryDto } from '../../application/dtos/get-month-availability-query.dto';
import { CancelAppointmentUseCase } from '../../application/use-cases/cancel-appointment.use-case';
import { ConfirmAppointmentUseCase } from '../../application/use-cases/confirm-appointment.use-case';
import { CreateAppointmentUseCase } from '../../application/use-cases/create-appointment.use-case';
import { GetAppointmentByReferenceUseCase } from '../../application/use-cases/get-appointment-by-reference.use-case';
import { GetDaySlotsUseCase } from '../../application/use-cases/get-day-slots.use-case';
import { GetMonthAvailabilityUseCase } from '../../application/use-cases/get-month-availability.use-case';
import { AppointmentMapper } from '../../infrastructure/mappers/appointment.mapper';

/** No guard on this route (must work for a signed-out visitor) — the Bearer token, if any, is read best-effort so a connected CLIENT's Customer still gets linked (see docs/features/appointments.md). */
function extractOptionalUserId(request: Request, accessTokenService: IAccessTokenService): string | null {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return null;
  }
  const payload: AccessTokenPayload | null = accessTokenService.verify(header.slice('Bearer '.length).trim());
  return payload?.sub ?? null;
}

@ApiTags('Appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(
    private readonly getMonthAvailabilityUseCase: GetMonthAvailabilityUseCase,
    private readonly getDaySlotsUseCase: GetDaySlotsUseCase,
    private readonly createAppointmentUseCase: CreateAppointmentUseCase,
    private readonly getAppointmentByReferenceUseCase: GetAppointmentByReferenceUseCase,
    private readonly cancelAppointmentUseCase: CancelAppointmentUseCase,
    private readonly confirmAppointmentUseCase: ConfirmAppointmentUseCase,
    @Inject(ACCESS_TOKEN_SERVICE) private readonly accessTokenService: IAccessTokenService,
  ) {}

  @Get('availability')
  @ApiOperation({ summary: 'Days available/full/closed for an atelier in a given month' })
  @ApiResponse({ status: 200, type: [MonthAvailabilityDayResponseDto] })
  async getMonthAvailability(@Query() query: GetMonthAvailabilityQueryDto): Promise<MonthAvailabilityDayResponseDto[]> {
    return this.getMonthAvailabilityUseCase.execute(query.atelierId, query.month);
  }

  @Get('availability/slots')
  @ApiOperation({ summary: 'Free slot start times for an atelier on a given day' })
  @ApiResponse({ status: 200, schema: { properties: { slots: { type: 'array', items: { type: 'string' } } } } })
  async getDaySlots(@Query() query: GetDaySlotsQueryDto): Promise<{ slots: string[] }> {
    const slots = await this.getDaySlotsUseCase.execute(query.atelierId, query.date);
    return { slots: slots.map((slot) => slot.toISOString()) };
  }

  @Post()
  @ApiOperation({ summary: 'Book an appointment — public, enriched with the Customer if a CLIENT is connected' })
  @ApiResponse({ status: 201, type: AppointmentResponseDto })
  async create(@Req() request: Request, @Body() dto: CreateAppointmentDto): Promise<AppointmentResponseDto> {
    const appointment = await this.createAppointmentUseCase.execute({
      userId: extractOptionalUserId(request, this.accessTokenService),
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      email: dto.email,
      type: dto.type,
      atelierId: dto.atelierId,
      scheduledAt: new Date(dto.scheduledAt),
      message: dto.message ?? null,
    });
    return AppointmentMapper.toResponseDto(appointment);
  }

  @Get(':reference')
  @ApiOperation({ summary: 'Get an appointment by its reference (the consultation token for a signed-out visitor)' })
  @ApiResponse({ status: 200, type: AppointmentResponseDto })
  async getByReference(@Param('reference') reference: string): Promise<AppointmentResponseDto> {
    const appointment = await this.getAppointmentByReferenceUseCase.execute(reference);
    return AppointmentMapper.toResponseDto(appointment);
  }

  @Post(':reference/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel an appointment by its reference' })
  @ApiResponse({ status: 200, type: AppointmentResponseDto })
  async cancel(@Param('reference') reference: string): Promise<AppointmentResponseDto> {
    const appointment = await this.cancelAppointmentUseCase.execute(reference);
    return AppointmentMapper.toResponseDto(appointment);
  }

  @Post(':reference/confirm')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('COUTURIERE', 'MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Confirm and self-assign a pending appointment (staff only)' })
  @ApiResponse({ status: 200, type: AppointmentResponseDto })
  async confirm(
    @Param('reference') reference: string,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<AppointmentResponseDto> {
    const appointment = await this.confirmAppointmentUseCase.execute(reference, user.sub);
    return AppointmentMapper.toResponseDto(appointment);
  }
}
