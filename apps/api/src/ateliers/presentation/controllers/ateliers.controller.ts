import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AtelierResponseDto } from '../../application/dtos/atelier-response.dto';
import { GetAtelierBySlugUseCase } from '../../application/use-cases/get-atelier-by-slug.use-case';
import { ListAteliersUseCase } from '../../application/use-cases/list-ateliers.use-case';
import { AtelierMapper } from '../../infrastructure/mappers/atelier.mapper';

@ApiTags('Ateliers')
@Controller('ateliers')
export class AteliersController {
  constructor(
    private readonly listAteliersUseCase: ListAteliersUseCase,
    private readonly getAtelierBySlugUseCase: GetAtelierBySlugUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List every atelier, sorted by city then name (no pagination — low volume)' })
  @ApiResponse({ status: 200, type: [AtelierResponseDto] })
  async list(): Promise<AtelierResponseDto[]> {
    const ateliers = await this.listAteliersUseCase.execute();
    return ateliers.map((atelier) => AtelierMapper.toResponseDto(atelier));
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get an atelier by slug, with its ordered media, opening hours and services' })
  @ApiResponse({ status: 200, type: AtelierResponseDto })
  async getBySlug(@Param('slug') slug: string): Promise<AtelierResponseDto> {
    const atelier = await this.getAtelierBySlugUseCase.execute(slug);
    return AtelierMapper.toResponseDto(atelier);
  }
}
