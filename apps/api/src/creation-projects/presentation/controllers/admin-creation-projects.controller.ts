import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreationProjectStage, Role } from '@angaly/types';

import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import { CreationProjectResponseDto } from '../../application/dtos/creation-project-response.dto';
import { UpdateCreationProjectStageDto } from '../../application/dtos/update-creation-project-stage.dto';
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

  @Patch(':id/stage')
  @ApiOperation({ summary: 'Move a creation project to another stage' })
  @ApiResponse({ status: 200, type: CreationProjectResponseDto })
  async updateStage(
    @Param('id') id: string,
    @Body() dto: UpdateCreationProjectStageDto,
  ): Promise<CreationProjectResponseDto> {
    return CreationProjectMapper.toResponse(await this.updateCreationProjectStageUseCase.execute(id, dto.stage));
  }
}
