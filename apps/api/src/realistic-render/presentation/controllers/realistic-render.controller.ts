import { Body, Controller, Get, Inject, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import type { AccessTokenPayload } from '../../../auth/domain/services/access-token.service';
import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import {
  CUSTOMER_REPOSITORY,
  ICustomerRepository,
} from '../../../customers/domain/repositories/customer.repository';
import { resolveCustomerId } from '../../../patterns/application/lib/resolve-customer-id';
import {
  LatestRealisticRenderQueryDto,
  RealisticRenderResponseDto,
  RequestRealisticRenderDto,
} from '../../application/dtos/realistic-render.dto';
import { GetRealisticRenderUseCase } from '../../application/use-cases/get-realistic-render.use-case';
import { RequestRealisticRenderUseCase } from '../../application/use-cases/request-realistic-render.use-case';
import { DEFAULT_REALISTIC_RENDER_POSE } from '../../domain/value-objects/realistic-render-status.vo';
import { RealisticRenderMapper } from '../../infrastructure/mappers/realistic-render.mapper';

@ApiTags('Realistic Render')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('pattern-versions/:id/realistic-render')
export class RealisticRenderController {
  constructor(
    private readonly requestRealisticRender: RequestRealisticRenderUseCase,
    private readonly getRealisticRender: GetRealisticRenderUseCase,
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: ICustomerRepository,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Queue a realistic render (Blender cloth simulation), or return the cached one' })
  @ApiResponse({ status: 201, type: RealisticRenderResponseDto })
  @ApiResponse({ status: 429, description: 'Daily quota reached' })
  async request(
    @Param('id') versionId: string,
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: RequestRealisticRenderDto,
  ): Promise<RealisticRenderResponseDto> {
    const customerId = await resolveCustomerId(this.customerRepository, user.sub);
    const render = await this.requestRealisticRender.execute(
      versionId,
      customerId,
      user.sub,
      dto.pose ?? DEFAULT_REALISTIC_RENDER_POSE,
    );
    return RealisticRenderMapper.toDto(render);
  }

  @Get()
  @ApiOperation({ summary: 'Latest realistic render of the version (null if none)' })
  @ApiResponse({ status: 200, type: RealisticRenderResponseDto })
  async latest(
    @Param('id') versionId: string,
    @CurrentUser() user: AccessTokenPayload,
    @Query() query: LatestRealisticRenderQueryDto,
  ): Promise<RealisticRenderResponseDto | null> {
    const customerId = await resolveCustomerId(this.customerRepository, user.sub);
    const render = await this.getRealisticRender.latest(versionId, customerId, query.pose);
    return render ? RealisticRenderMapper.toDto(render) : null;
  }

  @Get(':renderId')
  @ApiOperation({ summary: 'State of a realistic render (polled until DONE or FAILED)' })
  @ApiResponse({ status: 200, type: RealisticRenderResponseDto })
  async get(
    @Param('id') versionId: string,
    @Param('renderId') renderId: string,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<RealisticRenderResponseDto> {
    const customerId = await resolveCustomerId(this.customerRepository, user.sub);
    const render = await this.getRealisticRender.execute(versionId, renderId, customerId);
    return RealisticRenderMapper.toDto(render);
  }
}
