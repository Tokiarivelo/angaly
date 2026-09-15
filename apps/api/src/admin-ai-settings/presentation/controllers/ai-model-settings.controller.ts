import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@angaly/types';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator';
import type { AccessTokenPayload } from '../../../auth/domain/services/access-token.service';
import { GetAiModelSettingUseCase } from '../../application/use-cases/get-ai-model-setting.use-case';
import { UpdateAiModelSettingUseCase } from '../../application/use-cases/update-ai-model-setting.use-case';
import { UpdateAiModelSettingDto } from '../../application/dtos/update-ai-model-setting.dto';

/**
 * ADMIN-only: lets an administrator choose which backend
 * (`GEMINI` or `LOCAL_STATISTICAL`) `ai-inference` uses for measurement
 * estimation. See docs/features/ai-model-settings.md. Never exposed to
 * CLIENT/COUTURIERE/MANAGER.
 */
@ApiTags('Admin — AI Model Settings')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/ai-settings')
export class AiModelSettingsController {
  constructor(
    private readonly getAiModelSetting: GetAiModelSettingUseCase,
    private readonly updateAiModelSetting: UpdateAiModelSettingUseCase,
  ) {}

  @ApiOperation({ summary: 'Get the current AI model preference' })
  @Get()
  async get() {
    const setting = await this.getAiModelSetting.execute();
    return {
      measurementModel: setting.measurementModel,
      updatedAt: setting.updatedAt,
      updatedById: setting.updatedById,
    };
  }

  @ApiOperation({ summary: 'Change the AI model used for measurement estimation' })
  @Patch()
  async update(
    @Body() dto: UpdateAiModelSettingDto,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    const setting = await this.updateAiModelSetting.execute(dto.measurementModel, user.sub);
    return {
      measurementModel: setting.measurementModel,
      updatedAt: setting.updatedAt,
      updatedById: setting.updatedById,
    };
  }
}
