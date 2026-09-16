import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginatedResponse, Role } from '@angaly/types';

import type { AccessTokenPayload } from '../../../auth/domain/services/access-token.service';
import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import { CreateStaffUserDto } from '../../application/dtos/create-staff-user.dto';
import { ListStaffUsersQueryDto } from '../../application/dtos/list-staff-users-query.dto';
import {
  PaginatedStaffUserResponseDto,
  StaffUserResponseDto,
} from '../../application/dtos/staff-user-response.dto';
import { UpdateStaffRoleDto } from '../../application/dtos/update-staff-role.dto';
import { UpdateStaffStatusDto } from '../../application/dtos/update-staff-status.dto';
import { ChangeStaffRoleUseCase } from '../../application/use-cases/change-staff-role.use-case';
import { CreateStaffUserUseCase } from '../../application/use-cases/create-staff-user.use-case';
import { ListStaffUsersUseCase } from '../../application/use-cases/list-staff-users.use-case';
import { SetStaffUserStatusUseCase } from '../../application/use-cases/set-staff-user-status.use-case';
import { StaffUserMapper } from '../../infrastructure/mappers/staff-user.mapper';

/**
 * ADMIN-only: manages internal staff accounts (`COUTURIERE`/`MANAGER`/`ADMIN`).
 * `CLIENT` accounts are never touched here — see `auth`/`customers`. Mirrors
 * the JwtAuthGuard+RolesGuard+@Roles convention of
 * `admin-ai-settings/presentation/controllers/ai-model-settings.controller.ts`.
 */
@ApiTags('Admin — Staff Users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/users')
export class StaffUsersController {
  constructor(
    private readonly listStaffUsers: ListStaffUsersUseCase,
    private readonly createStaffUser: CreateStaffUserUseCase,
    private readonly changeStaffRole: ChangeStaffRoleUseCase,
    private readonly setStaffUserStatus: SetStaffUserStatusUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List staff accounts, filtered by role/isActive' })
  @ApiResponse({ status: 200, type: PaginatedStaffUserResponseDto })
  async list(
    @Query() query: ListStaffUsersQueryDto,
  ): Promise<PaginatedResponse<StaffUserResponseDto>> {
    const { items, total } = await this.listStaffUsers.execute(query);
    const totalPages = Math.max(1, Math.ceil(total / query.limit));

    return {
      data: items.map((item) => StaffUserMapper.toResponseDto(item)),
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages,
        hasNextPage: query.page < totalPages,
        hasPreviousPage: query.page > 1,
      },
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a staff account with an ADMIN-chosen initial password' })
  @ApiResponse({ status: 201, type: StaffUserResponseDto })
  async create(@Body() dto: CreateStaffUserDto): Promise<StaffUserResponseDto> {
    const user = await this.createStaffUser.execute(dto);
    return StaffUserMapper.toResponseDto(user);
  }

  @Patch(':id/role')
  @ApiOperation({ summary: "Change a staff member's role (an admin cannot change their own role)" })
  @ApiResponse({ status: 200, type: StaffUserResponseDto })
  async updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateStaffRoleDto,
    @CurrentUser() actor: AccessTokenPayload,
  ): Promise<StaffUserResponseDto> {
    const user = await this.changeStaffRole.execute({
      targetUserId: id,
      role: dto.role,
      actorUserId: actor.sub,
    });
    return StaffUserMapper.toResponseDto(user);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Activate/deactivate a staff account (an admin cannot deactivate themselves)' })
  @ApiResponse({ status: 200, type: StaffUserResponseDto })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStaffStatusDto,
    @CurrentUser() actor: AccessTokenPayload,
  ): Promise<StaffUserResponseDto> {
    const user = await this.setStaffUserStatus.execute({
      targetUserId: id,
      isActive: dto.isActive,
      actorUserId: actor.sub,
    });
    return StaffUserMapper.toResponseDto(user);
  }
}
