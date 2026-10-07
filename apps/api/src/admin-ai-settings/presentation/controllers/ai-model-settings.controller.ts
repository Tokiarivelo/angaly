import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@angaly/types';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator';
import type { AccessTokenPayload } from '../../../auth/domain/services/access-token.service';
import { GetAiModelSettingUseCase } from '../../application/use-cases/get-ai-model-setting.use-case';
import { UpdateAiRoutingUseCase } from '../../application/use-cases/update-ai-routing.use-case';
import { UpdateAiRoutingDto } from '../../application/dtos/update-ai-routing.dto';
import { AiRoutingSettingResponseDto } from '../../application/dtos/ai-provider-response.dto';

/**
 * ADMIN-only: lets an administrator choose which AI backend
 * powers measurement estimation and pattern suggestions in Pattern Studio.
 * See docs/features/ai-providers.md.
 */
@ApiTags('Admin — AI Model Settings')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/ai-settings')
export class AiModelSettingsController {
  constructor(
    private readonly getAiModelSetting: GetAiModelSettingUseCase,
    private readonly updateAiRouting: UpdateAiRoutingUseCase,
  ) {}

  @ApiOperation({ summary: 'Obtenir la configuration active du routage des modèles d’IA' })
  @ApiResponse({ status: 200, type: AiRoutingSettingResponseDto })
  @Get()
  async get(): Promise<AiRoutingSettingResponseDto> {
    const setting = await this.getAiModelSetting.execute();
    return {
      measurementModel: setting.measurementModel,
      measurementProvider: setting.measurementProvider,
      patternSuggestionProvider: setting.patternSuggestionProvider,
      updatedAt: setting.updatedAt.toISOString(),
      updatedById: setting.updatedById,
    };
  }

  @ApiOperation({ summary: 'Modifier les fournisseurs d’IA assignés aux usages de l’atelier' })
  @ApiResponse({ status: 200, type: AiRoutingSettingResponseDto })
  @Patch()
  async update(
    @Body() dto: UpdateAiRoutingDto,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<AiRoutingSettingResponseDto> {
    const setting = await this.updateAiRouting.execute(dto, user.sub);
    return {
      measurementModel: setting.measurementModel,
      measurementProvider: setting.measurementProvider,
      patternSuggestionProvider: setting.patternSuggestionProvider,
      updatedAt: setting.updatedAt.toISOString(),
      updatedById: setting.updatedById,
    };
  }
}
