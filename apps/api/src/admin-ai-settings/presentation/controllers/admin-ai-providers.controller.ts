import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AiProviderId, Role, type AiProviderModelsResponse } from '@angaly/types';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator';
import type { AccessTokenPayload } from '../../../auth/domain/services/access-token.service';
import { ListAiProvidersUseCase } from '../../application/use-cases/list-ai-providers.use-case';
import { UpsertAiProviderUseCase } from '../../application/use-cases/upsert-ai-provider.use-case';
import { RemoveAiProviderUseCase } from '../../application/use-cases/remove-ai-provider.use-case';
import { TestAiProviderUseCase } from '../../application/use-cases/test-ai-provider.use-case';
import { ListAiProviderModelsUseCase } from '../../application/use-cases/list-ai-provider-models.use-case';
import { UpsertAiProviderDto } from '../../application/dtos/upsert-ai-provider.dto';
import {
  AiProviderConfigViewDto,
  AiProvidersListResponseDto,
  TestAiProviderResponseDto,
} from '../../application/dtos/ai-provider-response.dto';

@ApiTags('Admin — AI Providers')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/ai-settings/providers')
export class AdminAiProvidersController {
  constructor(
    private readonly listAiProviders: ListAiProvidersUseCase,
    private readonly upsertAiProvider: UpsertAiProviderUseCase,
    private readonly removeAiProvider: RemoveAiProviderUseCase,
    private readonly testAiProvider: TestAiProviderUseCase,
    private readonly listAiProviderModels: ListAiProviderModelsUseCase,
  ) {}

  @ApiOperation({
    summary: 'Lister le catalogue et les configurations de fournisseurs IA',
    description: 'Renvoie le catalogue complet et les configurations enregistrées (clés API chiffrées au repos et masquées).',
  })
  @ApiResponse({ status: 200, type: AiProvidersListResponseDto })
  @Get()
  async list(): Promise<AiProvidersListResponseDto> {
    return this.listAiProviders.execute();
  }

  @ApiOperation({
    summary: 'Créer ou mettre à jour la configuration d’un fournisseur IA',
    description: 'Enregistre le modèle, l’URL de base et chiffre la clé API avec AES-256-GCM. Si apiKey est omise lors d’une modification, la clé existante est conservée.',
  })
  @ApiParam({ name: 'provider', enum: AiProviderId, description: 'Identifiant du fournisseur' })
  @ApiResponse({ status: 200, type: AiProviderConfigViewDto })
  @Put(':provider')
  async upsert(
    @Param('provider') provider: AiProviderId,
    @Body() dto: UpsertAiProviderDto,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<AiProviderConfigViewDto> {
    return this.upsertAiProvider.execute(provider, dto, user.sub);
  }

  @ApiOperation({
    summary: 'Supprimer la configuration d’un fournisseur IA',
    description: 'Retire un fournisseur. Impossible si le fournisseur est actuellement assigné au routage d’un usage d’atelier.',
  })
  @ApiParam({ name: 'provider', enum: AiProviderId, description: 'Identifiant du fournisseur' })
  @ApiResponse({ status: 200, description: 'Fournisseur retiré avec succès' })
  @Delete(':provider')
  async remove(@Param('provider') provider: AiProviderId): Promise<{ success: boolean }> {
    await this.removeAiProvider.execute(provider);
    return { success: true };
  }

  @ApiOperation({
    summary: 'Tester la connectivité d’un fournisseur IA',
    description: 'Déchiffre temporairement la clé API, exécute un test de connectivité, mesure la latence et met à jour le statut en base.',
  })
  @ApiParam({ name: 'provider', enum: AiProviderId, description: 'Identifiant du fournisseur' })
  @ApiResponse({ status: 200, type: TestAiProviderResponseDto })
  @Post(':provider/test')
  async test(@Param('provider') provider: AiProviderId): Promise<TestAiProviderResponseDto> {
    return this.testAiProvider.execute(provider);
  }

  @ApiOperation({
    summary: 'Lister les modèles non obsolètes d’un fournisseur IA',
    description: 'Interroge le fournisseur avec la clé enregistrée et filtre par recherche (paramètre q). Repli sur les suggestions du catalogue si l’API distante est indisponible.',
  })
  @ApiParam({ name: 'provider', enum: AiProviderId, description: 'Identifiant du fournisseur' })
  @Get(':provider/models')
  async models(
    @Param('provider') provider: AiProviderId,
    @Query('q') q?: string,
  ): Promise<AiProviderModelsResponse> {
    return this.listAiProviderModels.execute(provider, q);
  }
}
