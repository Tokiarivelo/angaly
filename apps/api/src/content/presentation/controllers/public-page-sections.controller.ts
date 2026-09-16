import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ListPublishedSectionsQueryDto } from '../../application/dtos/list-published-sections-query.dto';
import { PublicPageSectionResponseDto } from '../../application/dtos/public-page-section-response.dto';
import { ListPublishedSectionsUseCase } from '../../application/use-cases/list-published-sections.use-case';
import { PageSectionMapper } from '../../infrastructure/mappers/page-section.mapper';

/**
 * Unauthenticated, public read path — the first slice of
 * docs/phases/phase-6-admin-cms.md step 4 ("brancher les pages publiques").
 * Deliberately separate from `PageSectionsController`
 * (`content/sections/...`, MANAGER/ADMIN-only): this controller must never
 * carry `@Roles()`/`@UseGuards()`, and must only ever go through
 * `ListPublishedSectionsUseCase` → `IPageSectionRepository.findPublished`,
 * which is scoped to `status: PUBLISHED` at the repository level — never
 * `listAll`/`findAllLocales`/`getSection`, which also return DRAFT rows.
 */
@ApiTags('Content')
@Controller('content/public')
export class PublicPageSectionsController {
  constructor(private readonly listPublishedSections: ListPublishedSectionsUseCase) {}

  @Get(':page')
  @ApiOperation({ summary: 'List PUBLISHED sections for a page (public, unauthenticated)' })
  @ApiResponse({ status: 200, type: [PublicPageSectionResponseDto] })
  async list(
    @Param('page') page: string,
    @Query() query: ListPublishedSectionsQueryDto,
  ): Promise<PublicPageSectionResponseDto[]> {
    const sections = await this.listPublishedSections.execute(page, query.locale);
    return sections.map((section) => PageSectionMapper.toPublicResponseDto(section));
  }
}
