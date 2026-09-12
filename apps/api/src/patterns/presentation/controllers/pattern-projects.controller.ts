import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import type { AccessTokenPayload } from '../../../auth/domain/services/access-token.service';
import {
  CUSTOMER_REPOSITORY,
  ICustomerRepository,
} from '../../../customers/domain/repositories/customer.repository';
import { resolveCustomerId } from '../../application/lib/resolve-customer-id';

import { CreatePatternProjectDto } from '../../application/dtos/create-pattern-project.dto';
import { UpdatePatternProjectDto } from '../../application/dtos/update-pattern-project.dto';
import { GeneratePatternVersionDto } from '../../application/dtos/generate-pattern-version.dto';
import { PatternProjectResponseDto } from '../../application/dtos/pattern-project-response.dto';
import { PatternVersionDto } from '../../application/dtos/pattern-version-response.dto';

import { CreatePatternProjectUseCase } from '../../application/use-cases/create-pattern-project.use-case';
import { GetPatternProjectUseCase } from '../../application/use-cases/get-pattern-project.use-case';
import { ListPatternProjectsUseCase } from '../../application/use-cases/list-pattern-projects.use-case';
import { UpdatePatternProjectStepUseCase } from '../../application/use-cases/update-pattern-project-step.use-case';
import { GeneratePatternVersionUseCase } from '../../application/use-cases/generate-pattern-version.use-case';
import { RequestReviewUseCase } from '../../application/use-cases/request-review.use-case';
import { ListPatternVersionsUseCase } from '../../application/use-cases/list-pattern-versions.use-case';

import { PatternProjectMapper } from '../../infrastructure/mappers/pattern-project.mapper';
import { PatternVersionMapper } from '../../infrastructure/mappers/pattern-version.mapper';
import { PatternStatus } from '../../domain/value-objects/pattern-status.vo';

@ApiTags('Pattern Projects')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('pattern-projects')
export class PatternProjectsController {
  constructor(
    private readonly createPatternProjectUseCase: CreatePatternProjectUseCase,
    private readonly getPatternProjectUseCase: GetPatternProjectUseCase,
    private readonly listPatternProjectsUseCase: ListPatternProjectsUseCase,
    private readonly updatePatternProjectStepUseCase: UpdatePatternProjectStepUseCase,
    private readonly generatePatternVersionUseCase: GeneratePatternVersionUseCase,
    private readonly requestReviewUseCase: RequestReviewUseCase,
    private readonly listPatternVersionsUseCase: ListPatternVersionsUseCase,
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: ICustomerRepository,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new pattern project (wizard initial step)' })
  @ApiResponse({ status: 201, type: PatternProjectResponseDto })
  async create(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreatePatternProjectDto,
  ): Promise<PatternProjectResponseDto> {
    const customerId = await resolveCustomerId(this.customerRepository, user.sub);
    const project = await this.createPatternProjectUseCase.execute(customerId, dto);
    return PatternProjectMapper.toDto(project);
  }

  @Get()
  @ApiOperation({ summary: 'List pattern projects for current user' })
  @ApiQuery({ name: 'mine', required: false, type: Boolean })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, type: [PatternProjectResponseDto] })
  async list(
    @CurrentUser() user: AccessTokenPayload,
    @Query('mine') _mine?: string,
    @Query('status') statusParam?: string,
    @Query('limit') limitParam?: string,
  ): Promise<PatternProjectResponseDto[]> {
    const customerId = await resolveCustomerId(this.customerRepository, user.sub);
    const status = statusParam
      ? (statusParam.split(',') as PatternStatus[])
      : undefined;
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    const projects = await this.listPatternProjectsUseCase.execute(customerId, {
      status,
      limit,
    });
    return projects.map(PatternProjectMapper.toDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get pattern project by ID' })
  @ApiResponse({ status: 200, type: PatternProjectResponseDto })
  async getById(
    @Param('id') id: string,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<PatternProjectResponseDto> {
    const customerId = await resolveCustomerId(this.customerRepository, user.sub);
    const project = await this.getPatternProjectUseCase.execute(id, customerId);
    return PatternProjectMapper.toDto(project);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update pattern project wizard step' })
  @ApiResponse({ status: 200, type: PatternProjectResponseDto })
  async updateStep(
    @Param('id') id: string,
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: UpdatePatternProjectDto,
  ): Promise<PatternProjectResponseDto> {
    const customerId = await resolveCustomerId(this.customerRepository, user.sub);
    const project = await this.updatePatternProjectStepUseCase.execute(id, customerId, dto);
    return PatternProjectMapper.toDto(project);
  }

  @Post(':id/generate')
  @ApiOperation({ summary: 'Generate pattern version using deterministic pattern engine' })
  @ApiResponse({ status: 201, type: PatternVersionDto })
  async generate(
    @Param('id') id: string,
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto?: GeneratePatternVersionDto,
  ): Promise<PatternVersionDto> {
    const customerId = await resolveCustomerId(this.customerRepository, user.sub);
    const version = await this.generatePatternVersionUseCase.execute(id, customerId, dto);
    return PatternVersionMapper.toDto(version);
  }

  @Post(':id/request-review')
  @ApiOperation({ summary: 'Request atelier review for a pattern project' })
  @ApiResponse({ status: 200, type: PatternProjectResponseDto })
  async requestReview(
    @Param('id') id: string,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<PatternProjectResponseDto> {
    const customerId = await resolveCustomerId(this.customerRepository, user.sub);
    const project = await this.requestReviewUseCase.execute(id, customerId);
    return PatternProjectMapper.toDto(project);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'List version history for a pattern project' })
  @ApiResponse({ status: 200, type: [PatternVersionDto] })
  async listVersions(
    @Param('id') id: string,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<PatternVersionDto[]> {
    const customerId = await resolveCustomerId(this.customerRepository, user.sub);
    const versions = await this.listPatternVersionsUseCase.execute(id, customerId);
    return versions.map(PatternVersionMapper.toDto);
  }
}
