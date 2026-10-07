import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreationProjectStage, Role } from '@angaly/types';

import type { AccessTokenPayload } from '../../../auth/domain/services/access-token.service';
import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import { AddCreationProjectStageMediaDto } from '../../application/dtos/add-creation-project-stage-media.dto';
import { AddCreationProjectStageNoteDto } from '../../application/dtos/add-creation-project-stage-note.dto';
import { AssignCreationProjectDto } from '../../application/dtos/assign-creation-project.dto';
import { CreateAdminCreationProjectDto } from '../../application/dtos/create-admin-creation-project.dto';
import { GenerateCreationProjectAiPatternDto } from '../../application/dtos/generate-creation-project-ai-pattern.dto';
import {
  CustomerLookupResponseDto,
  QuoteLookupResponseDto,
} from '../../application/dtos/creation-project-lookup.dto';
import {
  CreationProjectAssigneeResponseDto,
  CreationProjectDetailResponseDto,
  CreationProjectResponseDto,
  CreationProjectStageMediaResponseDto,
  CreationProjectStageNoteResponseDto,
} from '../../application/dtos/creation-project-response.dto';
import { UpdateCreationProjectStageDto } from '../../application/dtos/update-creation-project-stage.dto';
import { AddCreationProjectStageMediaUseCase } from '../../application/use-cases/add-creation-project-stage-media.use-case';
import { AddCreationProjectStageNoteUseCase } from '../../application/use-cases/add-creation-project-stage-note.use-case';
import { AssignCreationProjectUseCase } from '../../application/use-cases/assign-creation-project.use-case';
import { CreateAdminCreationProjectUseCase } from '../../application/use-cases/create-admin-creation-project.use-case';
import { DeleteCreationProjectStageMediaUseCase } from '../../application/use-cases/delete-creation-project-stage-media.use-case';
import { DeleteCreationProjectStageNoteUseCase } from '../../application/use-cases/delete-creation-project-stage-note.use-case';
import { GenerateCreationProjectAiPatternUseCase } from '../../application/use-cases/generate-creation-project-ai-pattern.use-case';
import { GetAdminCreationProjectUseCase } from '../../application/use-cases/get-admin-creation-project.use-case';
import { ListAssignableStaffUseCase } from '../../application/use-cases/list-assignable-staff.use-case';
import { ListAllCreationProjectsUseCase } from '../../application/use-cases/list-all-creation-projects.use-case';
import { ListCustomersLookupUseCase } from '../../application/use-cases/list-customers-lookup.use-case';
import { ListQuotesLookupUseCase } from '../../application/use-cases/list-quotes-lookup.use-case';
import { UpdateCreationProjectStageUseCase } from '../../application/use-cases/update-creation-project-stage.use-case';
import { CreationProjectMapper } from '../../infrastructure/mappers/creation-project.mapper';

@ApiTags('Creation Projects (admin)')
@ApiBearerAuth('access-token')
@Controller('admin/creation-projects')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.COUTURIERE, Role.MANAGER, Role.ADMIN)
export class AdminCreationProjectsController {
  constructor(
    private readonly listAllCreationProjectsUseCase: ListAllCreationProjectsUseCase,
    private readonly updateCreationProjectStageUseCase: UpdateCreationProjectStageUseCase,
    private readonly assignCreationProjectUseCase: AssignCreationProjectUseCase,
    private readonly getAdminCreationProjectUseCase: GetAdminCreationProjectUseCase,
    private readonly listAssignableStaffUseCase: ListAssignableStaffUseCase,
    private readonly createAdminCreationProjectUseCase: CreateAdminCreationProjectUseCase,
    private readonly listCustomersLookupUseCase: ListCustomersLookupUseCase,
    private readonly listQuotesLookupUseCase: ListQuotesLookupUseCase,
    private readonly addCreationProjectStageNoteUseCase: AddCreationProjectStageNoteUseCase,
    private readonly deleteCreationProjectStageNoteUseCase: DeleteCreationProjectStageNoteUseCase,
    private readonly addCreationProjectStageMediaUseCase: AddCreationProjectStageMediaUseCase,
    private readonly deleteCreationProjectStageMediaUseCase: DeleteCreationProjectStageMediaUseCase,
    private readonly generateCreationProjectAiPatternUseCase: GenerateCreationProjectAiPatternUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List every creation project (back-office), optionally by stage' })
  @ApiQuery({ name: 'stage', enum: CreationProjectStage, required: false })
  @ApiResponse({ status: 200, type: [CreationProjectResponseDto] })
  async list(@Query('stage') stage?: CreationProjectStage): Promise<CreationProjectResponseDto[]> {
    const validStage = stage && Object.values(CreationProjectStage).includes(stage) ? stage : undefined;
    const projects = await this.listAllCreationProjectsUseCase.execute(validStage);
    return projects.map((project) => CreationProjectMapper.toResponse(project));
  }

  @Post()
  @ApiOperation({ summary: 'Create a new creation project from staff back-office' })
  @ApiResponse({ status: 201, type: CreationProjectResponseDto })
  async create(
    @Body() dto: CreateAdminCreationProjectDto,
    @CurrentUser() actor: AccessTokenPayload,
  ): Promise<CreationProjectResponseDto> {
    const project = await this.createAdminCreationProjectUseCase.execute(dto, actor.sub);
    return CreationProjectMapper.toResponse(project);
  }

  // Déclarés avant `:id` pour ne pas être capturés par la route paramétrée.
  @Get('assignees')
  @ApiOperation({ summary: 'List active staff members a project can be assigned to' })
  @ApiResponse({ status: 200, type: [CreationProjectAssigneeResponseDto] })
  async listAssignees(): Promise<CreationProjectAssigneeResponseDto[]> {
    return this.listAssignableStaffUseCase.execute();
  }

  @Get('customers')
  @ApiOperation({ summary: 'Search or list existing customers for project opening' })
  @ApiQuery({ name: 'q', required: false, description: 'Search term for name, email or phone' })
  @ApiResponse({ status: 200, type: [CustomerLookupResponseDto] })
  async listCustomers(@Query('q') q?: string): Promise<CustomerLookupResponseDto[]> {
    return this.listCustomersLookupUseCase.execute(q);
  }

  @Get('quotes')
  @ApiOperation({ summary: 'List recent quotes attachable to a creation project' })
  @ApiResponse({ status: 200, type: [QuoteLookupResponseDto] })
  async listQuotes(): Promise<QuoteLookupResponseDto[]> {
    return this.listQuotesLookupUseCase.execute();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Creation project detail with its stage history (back-office)' })
  @ApiResponse({ status: 200, type: CreationProjectDetailResponseDto })
  async detail(@Param('id') id: string): Promise<CreationProjectDetailResponseDto> {
    return CreationProjectMapper.toDetailResponse(await this.getAdminCreationProjectUseCase.execute(id));
  }

  @Patch(':id/assignee')
  @ApiOperation({ summary: 'Assign a creation project to a staff member (userId null to unassign)' })
  @ApiResponse({ status: 200, type: CreationProjectResponseDto })
  async assign(
    @Param('id') id: string,
    @Body() dto: AssignCreationProjectDto,
  ): Promise<CreationProjectResponseDto> {
    return CreationProjectMapper.toResponse(await this.assignCreationProjectUseCase.execute(id, dto.userId ?? null));
  }

  @Patch(':id/stage')
  @ApiOperation({ summary: 'Move a creation project to another stage' })
  @ApiResponse({ status: 200, type: CreationProjectResponseDto })
  async updateStage(
    @Param('id') id: string,
    @Body() dto: UpdateCreationProjectStageDto,
    @CurrentUser() actor: AccessTokenPayload,
  ): Promise<CreationProjectResponseDto> {
    return CreationProjectMapper.toResponse(
      await this.updateCreationProjectStageUseCase.execute(id, dto.stage, actor.sub),
    );
  }

  @Post(':id/notes')
  @ApiOperation({ summary: 'Add a workshop note for a specific stage of a creation project' })
  @ApiResponse({ status: 201, type: CreationProjectStageNoteResponseDto })
  async addStageNote(
    @Param('id') id: string,
    @Body() dto: AddCreationProjectStageNoteDto,
    @CurrentUser() actor: AccessTokenPayload,
  ): Promise<CreationProjectStageNoteResponseDto> {
    const note = await this.addCreationProjectStageNoteUseCase.execute({
      projectId: id,
      stage: dto.stage,
      content: dto.content,
      authorId: actor.sub,
    });
    return {
      id: note.id,
      projectId: note.projectId,
      stage: note.stage,
      content: note.content,
      authorEmail: note.authorEmail,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    };
  }

  @Delete(':id/notes/:noteId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a workshop note from a creation project' })
  @ApiResponse({ status: 204 })
  async deleteStageNote(
    @Param('id') id: string,
    @Param('noteId') noteId: string,
  ): Promise<void> {
    await this.deleteCreationProjectStageNoteUseCase.execute({ projectId: id, noteId });
  }

  @Post(':id/media')
  @ApiOperation({ summary: 'Add a media file / document reference for a specific stage of a creation project' })
  @ApiResponse({ status: 201, type: CreationProjectStageMediaResponseDto })
  async addStageMedia(
    @Param('id') id: string,
    @Body() dto: AddCreationProjectStageMediaDto,
    @CurrentUser() actor: AccessTokenPayload,
  ): Promise<CreationProjectStageMediaResponseDto> {
    const media = await this.addCreationProjectStageMediaUseCase.execute({
      projectId: id,
      stage: dto.stage,
      url: dto.url,
      title: dto.title ?? null,
      fileName: dto.fileName ?? null,
      mimeType: dto.mimeType ?? null,
      sizeBytes: dto.sizeBytes ?? null,
      uploadedById: actor.sub,
    });
    return {
      id: media.id,
      projectId: media.projectId,
      stage: media.stage,
      url: media.url,
      title: media.title,
      fileName: media.fileName,
      mimeType: media.mimeType,
      sizeBytes: media.sizeBytes,
      uploadedByEmail: media.uploadedByEmail,
      createdAt: media.createdAt.toISOString(),
    };
  }

  @Delete(':id/media/:mediaId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a media attachment from a creation project stage' })
  @ApiResponse({ status: 204 })
  async deleteStageMedia(
    @Param('id') id: string,
    @Param('mediaId') mediaId: string,
  ): Promise<void> {
    await this.deleteCreationProjectStageMediaUseCase.execute({ projectId: id, mediaId });
  }

  @Post(':id/generate-pattern')
  @ApiOperation({
    summary: 'Générer un tracé de patron géométrique assisté par IA pour l’étape Patron',
    description:
      'Exécute le moteur géométrique déterministe avec suggestion IA optionnelle et attache le tracé SVG aux médias du projet.',
  })
  @ApiResponse({ status: 201, description: 'Patron géométrique généré avec succès.' })
  @ApiResponse({ status: 404, description: 'Projet de création introuvable.' })
  async generatePattern(
    @Param('id') id: string,
    @Body() dto: GenerateCreationProjectAiPatternDto,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.generateCreationProjectAiPatternUseCase.execute(id, dto, user.sub);
  }
}

