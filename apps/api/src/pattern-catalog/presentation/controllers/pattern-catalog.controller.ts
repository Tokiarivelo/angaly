import { Controller, Get, Inject, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import type { AccessTokenPayload } from '../../../auth/domain/services/access-token.service';
import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { CUSTOMER_REPOSITORY, ICustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import { resolveCustomerId } from '../../../patterns/application/lib/resolve-customer-id';
import { CreatedFromCatalogDto, PatternCatalogEntryDto } from '../../application/dtos/pattern-catalog-response.dto';
import { CreateProjectFromCatalogUseCase } from '../../application/use-cases/create-project-from-catalog.use-case';
import { ListPatternCatalogUseCase } from '../../application/use-cases/list-pattern-catalog.use-case';

@ApiTags('Pattern Catalog')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('pattern-catalog')
export class PatternCatalogController {
  constructor(
    private readonly listCatalog: ListPatternCatalogUseCase,
    private readonly createFromCatalog: CreateProjectFromCatalogUseCase,
    @Inject(CUSTOMER_REPOSITORY) private readonly customerRepository: ICustomerRepository,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Dresses the pattern engine can make, with their inspiration photo' })
  @ApiResponse({ status: 200, type: [PatternCatalogEntryDto] })
  async list(): Promise<PatternCatalogEntryDto[]> {
    return this.listCatalog.execute();
  }

  @Post(':id/projects')
  @ApiOperation({ summary: 'Start a pattern project from a catalogue dress' })
  @ApiResponse({ status: 201, type: CreatedFromCatalogDto })
  async create(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string): Promise<CreatedFromCatalogDto> {
    const customerId = await resolveCustomerId(this.customerRepository, user.sub);
    return this.createFromCatalog.execute({ entryId: id, customerId, userId: user.sub });
  }
}
