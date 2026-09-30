import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import type { AccessTokenPayload } from '../../../auth/domain/services/access-token.service';
import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { CreationProjectResponseDto } from '../../application/dtos/creation-project-response.dto';
import { GetCreationProjectUseCase } from '../../application/use-cases/get-creation-project.use-case';
import { ListCreationProjectsUseCase } from '../../application/use-cases/list-creation-projects.use-case';
import { CreationProjectMapper } from '../../infrastructure/mappers/creation-project.mapper';

@ApiTags('Creation Projects')
@ApiBearerAuth('access-token')
@Controller('creation-projects')
@UseGuards(JwtAuthGuard)
export class CreationProjectsController {
  constructor(
    private readonly listCreationProjectsUseCase: ListCreationProjectsUseCase,
    private readonly getCreationProjectUseCase: GetCreationProjectUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: "List the current customer's creation projects (spec §53), newest first" })
  @ApiResponse({ status: 200, type: [CreationProjectResponseDto] })
  async list(@CurrentUser() user: AccessTokenPayload): Promise<CreationProjectResponseDto[]> {
    const projects = await this.listCreationProjectsUseCase.execute(user.sub);
    return projects.map(CreationProjectMapper.toResponse);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one creation project owned by the current customer' })
  @ApiResponse({ status: 200, type: CreationProjectResponseDto })
  async get(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string): Promise<CreationProjectResponseDto> {
    return CreationProjectMapper.toResponse(await this.getCreationProjectUseCase.execute(user.sub, id));
  }
}
