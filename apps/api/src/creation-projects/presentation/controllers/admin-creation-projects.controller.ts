import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreationProjectStage, Role } from '@angaly/types';

import type { AccessTokenPayload } from '../../../auth/domain/services/access-token.service';
import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import { AssignCreationProjectDto } from '../../application/dtos/assign-creation-project.dto';
import {
  CreationProjectAssigneeResponseDto,
  CreationProjectDetailResponseDto,
  CreationProjectResponseDto,
} from '../../application/dtos/creation-project-response.dto';
import { UpdateCreationProjectStageDto } from '../../application/dtos/update-creation-project-stage.dto';
import { AssignCreationProjectUseCase } from '../../application/use-cases/assign-creation-project.use-case';
import { GetAdminCreationProjectUseCase } from '../../application/use-cases/get-admin-creation-project.use-case';
import { ListAssignableStaffUseCase } from '../../application/use-cases/list-assignable-staff.use-case';
import { ListAllCreationProjectsUseCase } from '../../application/use-cases/list-all-creation-projects.use-case';
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

  // Déclaré avant `:id` pour ne pas être capturé par la route paramétrée.
  @Get('assignees')
  @ApiOperation({ summary: 'List active staff members a project can be assigned to' })
  @ApiResponse({ status: 200, type: [CreationProjectAssigneeResponseDto] })
  async listAssignees(): Promise<CreationProjectAssigneeResponseDto[]> {
    return this.listAssignableStaffUseCase.execute();
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
}
