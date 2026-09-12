import {
  Body,
  Controller,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import type { AccessTokenPayload } from '../../../auth/domain/services/access-token.service';
import {
  CUSTOMER_REPOSITORY,
  ICustomerRepository,
} from '../../../customers/domain/repositories/customer.repository';
import { resolveCustomerId } from '../../application/lib/resolve-customer-id';

import { ExportPatternVersionDto } from '../../application/dtos/export-pattern-version.dto';
import {
  PatternExportDto,
  PatternVersionDto,
} from '../../application/dtos/pattern-version-response.dto';

import { ExportPatternVersionUseCase } from '../../application/use-cases/export-pattern-version.use-case';
import { RestorePatternVersionUseCase } from '../../application/use-cases/restore-pattern-version.use-case';

import { PatternVersionMapper } from '../../infrastructure/mappers/pattern-version.mapper';

@ApiTags('Pattern Versions')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('pattern-versions')
export class PatternVersionsController {
  constructor(
    private readonly exportPatternVersionUseCase: ExportPatternVersionUseCase,
    private readonly restorePatternVersionUseCase: RestorePatternVersionUseCase,
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: ICustomerRepository,
  ) {}

  @Post(':id/export')
  @ApiOperation({ summary: 'Export validated pattern version into PDF, SVG or DXF' })
  @ApiResponse({ status: 201, type: PatternExportDto })
  async exportVersion(
    @Param('id') id: string,
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: ExportPatternVersionDto,
  ): Promise<PatternExportDto> {
    const customerId = await resolveCustomerId(this.customerRepository, user.sub);
    const patternExport = await this.exportPatternVersionUseCase.execute(
      id,
      customerId,
      dto.format,
    );
    return PatternVersionMapper.toExportDto(patternExport);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a previous version into a new version' })
  @ApiResponse({ status: 201, type: PatternVersionDto })
  async restoreVersion(
    @Param('id') id: string,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<PatternVersionDto> {
    const customerId = await resolveCustomerId(this.customerRepository, user.sub);
    const version = await this.restorePatternVersionUseCase.execute(id, customerId);
    return PatternVersionMapper.toDto(version);
  }
}
