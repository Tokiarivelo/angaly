import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { Role } from '@angaly/types';
import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator';

import { MeasurementProfileDto } from '../../application/dtos/measurement-profile.dto';
import { CreateMeasurementProfileDto } from '../../application/dtos/create-measurement-profile.dto';
import { UpdateMeasurementProfileDto } from '../../application/dtos/update-measurement-profile.dto';

import { CreateMeasurementProfileUseCase } from '../../application/use-cases/create-measurement-profile.use-case';
import { UpdateMeasurementProfileUseCase } from '../../application/use-cases/update-measurement-profile.use-case';
import { DuplicateMeasurementProfileUseCase } from '../../application/use-cases/duplicate-measurement-profile.use-case';
import { DeleteMeasurementProfileUseCase } from '../../application/use-cases/delete-measurement-profile.use-case';
import { ListMeasurementProfilesUseCase } from '../../application/use-cases/list-measurement-profiles.use-case';
import { GetMeasurementProfileUseCase } from '../../application/use-cases/get-measurement-profile.use-case';
import { MeasurementProfileMapper } from '../../infrastructure/mappers/measurement-profile.mapper';

@ApiTags('Measurement Profiles')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CLIENT)
@Controller('api/measurement-profiles')
export class MeasurementProfilesController {
  constructor(
    private readonly createMeasurementProfileUseCase: CreateMeasurementProfileUseCase,
    private readonly updateMeasurementProfileUseCase: UpdateMeasurementProfileUseCase,
    private readonly duplicateMeasurementProfileUseCase: DuplicateMeasurementProfileUseCase,
    private readonly deleteMeasurementProfileUseCase: DeleteMeasurementProfileUseCase,
    private readonly listMeasurementProfilesUseCase: ListMeasurementProfilesUseCase,
    private readonly getMeasurementProfileUseCase: GetMeasurementProfileUseCase,
  ) {}

  @ApiOperation({ summary: 'List customer measurement profiles' })
  @ApiResponse({ status: 200, type: [MeasurementProfileDto] })
  @Get()
  async listProfiles(@CurrentUser() user: any): Promise<MeasurementProfileDto[]> {
    const profiles = await this.listMeasurementProfilesUseCase.execute(user.customerId);
    return profiles.map(MeasurementProfileMapper.toDto);
  }

  @ApiOperation({ summary: 'Get a measurement profile by ID' })
  @ApiResponse({ status: 200, type: MeasurementProfileDto })
  @Get(':id')
  async getProfile(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<MeasurementProfileDto> {
    const profile = await this.getMeasurementProfileUseCase.execute(id, user.customerId);
    return MeasurementProfileMapper.toDto(profile);
  }

  @ApiOperation({ summary: 'Create a measurement profile' })
  @ApiResponse({ status: 201, type: MeasurementProfileDto })
  @Post()
  async createProfile(
    @Body() dto: CreateMeasurementProfileDto,
    @CurrentUser() user: any,
  ): Promise<MeasurementProfileDto> {
    const profile = await this.createMeasurementProfileUseCase.execute(user.customerId, dto);
    return MeasurementProfileMapper.toDto(profile);
  }

  @ApiOperation({ summary: 'Update a measurement profile' })
  @ApiResponse({ status: 200, type: MeasurementProfileDto })
  @Patch(':id')
  async updateProfile(
    @Param('id') id: string,
    @Body() dto: UpdateMeasurementProfileDto,
    @CurrentUser() user: any,
  ): Promise<MeasurementProfileDto> {
    const profile = await this.updateMeasurementProfileUseCase.execute(id, user.customerId, dto);
    return MeasurementProfileMapper.toDto(profile);
  }

  @ApiOperation({ summary: 'Duplicate a measurement profile' })
  @ApiResponse({ status: 201, type: MeasurementProfileDto })
  @Post(':id/duplicate')
  async duplicateProfile(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<MeasurementProfileDto> {
    const profile = await this.duplicateMeasurementProfileUseCase.execute(id, user.customerId);
    return MeasurementProfileMapper.toDto(profile);
  }

  @ApiOperation({ summary: 'Delete a measurement profile' })
  @ApiResponse({ status: 204 })
  @Delete(':id')
  async deleteProfile(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<void> {
    await this.deleteMeasurementProfileUseCase.execute(id, user.customerId);
  }
}
