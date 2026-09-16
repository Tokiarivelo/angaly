import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ContentStatus, Locale, Role } from '@angaly/types';

import type { AccessTokenPayload } from '../../../auth/domain/services/access-token.service';
import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import { PageSectionGroupResponseDto } from '../../application/dtos/page-section-group-response.dto';
import { PageSectionResponseDto } from '../../application/dtos/page-section-response.dto';
import { PageSectionVersionResponseDto } from '../../application/dtos/page-section-version-response.dto';
import { PublishSectionDto } from '../../application/dtos/publish-section.dto';
import { SaveSectionDraftDto } from '../../application/dtos/save-section-draft.dto';
import { GetSectionUseCase } from '../../application/use-cases/get-section.use-case';
import { ListSectionsUseCase } from '../../application/use-cases/list-sections.use-case';
import { ListSectionVersionsUseCase } from '../../application/use-cases/list-section-versions.use-case';
import { PublishSectionUseCase } from '../../application/use-cases/publish-section.use-case';
import { RestoreSectionVersionUseCase } from '../../application/use-cases/restore-section-version.use-case';
import { SaveSectionDraftUseCase } from '../../application/use-cases/save-section-draft.use-case';
import { PageSectionMapper } from '../../infrastructure/mappers/page-section.mapper';

/**
 * `MANAGER`/`ADMIN`-only, no public read endpoint in this pass — the Phase 1
 * public pages still render hardcoded literals (see docs/features/content.md,
 * step 4 of docs/phases/phase-6-admin-cms.md is explicitly out of scope for
 * this session). Only `admin-gestion-contenu` consumes this controller today.
 */
@ApiTags('Admin — Content')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.MANAGER, Role.ADMIN)
@Controller('content/sections')
export class PageSectionsController {
  constructor(
    private readonly listSections: ListSectionsUseCase,
    private readonly getSection: GetSectionUseCase,
    private readonly saveSectionDraft: SaveSectionDraftUseCase,
    private readonly publishSection: PublishSectionUseCase,
    private readonly listSectionVersions: ListSectionVersionsUseCase,
    private readonly restoreSectionVersion: RestoreSectionVersionUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List editable sections, grouped by page' })
  @ApiResponse({ status: 200, type: [PageSectionGroupResponseDto] })
  async list(): Promise<PageSectionGroupResponseDto[]> {
    const groups = await this.listSections.execute();
    return groups.map((group) => ({
      page: group.page,
      sections: group.sections.map((section) => ({
        sectionKey: section.sectionKey,
        status: section.status as ContentStatus,
        updatedAt: section.updatedAt.toISOString(),
        locales: section.locales as Locale[],
      })),
    }));
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'List the version history of a section (by PageSection id)' })
  @ApiResponse({ status: 200, type: [PageSectionVersionResponseDto] })
  async versions(@Param('id') id: string): Promise<PageSectionVersionResponseDto[]> {
    const versions = await this.listSectionVersions.execute(id);
    return versions.map((version) => PageSectionMapper.versionToResponseDto(version));
  }

  @Post(':id/versions/:versionId/restore')
  @ApiOperation({ summary: 'Restore a previous version (snapshots the current state first)' })
  @ApiResponse({ status: 200, type: PageSectionResponseDto })
  async restore(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @CurrentUser() actor: AccessTokenPayload,
  ): Promise<PageSectionResponseDto> {
    const section = await this.restoreSectionVersion.execute({
      pageSectionId: id,
      versionId,
      actorId: actor.sub,
    });
    return PageSectionMapper.toResponseDto(section);
  }

  @Get(':page/:sectionKey')
  @ApiOperation({ summary: 'Get every existing locale row for a section' })
  @ApiResponse({ status: 200, type: [PageSectionResponseDto] })
  async get(
    @Param('page') page: string,
    @Param('sectionKey') sectionKey: string,
  ): Promise<PageSectionResponseDto[]> {
    const sections = await this.getSection.execute(page, sectionKey);
    return sections.map((section) => PageSectionMapper.toResponseDto(section));
  }

  @Patch(':page/:sectionKey')
  @ApiOperation({ summary: 'Save a section as DRAFT for one locale (snapshots the prior state first)' })
  @ApiResponse({ status: 200, type: PageSectionResponseDto })
  async saveDraft(
    @Param('page') page: string,
    @Param('sectionKey') sectionKey: string,
    @Body() dto: SaveSectionDraftDto,
    @CurrentUser() actor: AccessTokenPayload,
  ): Promise<PageSectionResponseDto> {
    const section = await this.saveSectionDraft.execute({
      page,
      sectionKey,
      locale: dto.locale,
      titleText: dto.titleText,
      subtitleText: dto.subtitleText,
      bodyText: dto.bodyText,
      ctaPrimaryLabel: dto.ctaPrimaryLabel,
      ctaSecondaryLabel: dto.ctaSecondaryLabel,
      dataJson: dto.dataJson,
      mediaId: dto.mediaId,
      actorId: actor.sub,
    });
    return PageSectionMapper.toResponseDto(section);
  }

  @Post(':page/:sectionKey/publish')
  @ApiOperation({ summary: 'Publish a section for one locale (explicit action, never implicit on save)' })
  @ApiResponse({ status: 200, type: PageSectionResponseDto })
  async publish(
    @Param('page') page: string,
    @Param('sectionKey') sectionKey: string,
    @Body() dto: PublishSectionDto,
    @CurrentUser() actor: AccessTokenPayload,
  ): Promise<PageSectionResponseDto> {
    const section = await this.publishSection.execute({
      page,
      sectionKey,
      locale: dto.locale,
      actorId: actor.sub,
    });
    return PageSectionMapper.toResponseDto(section);
  }
}
