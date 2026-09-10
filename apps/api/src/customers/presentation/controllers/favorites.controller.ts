import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import type { AccessTokenPayload } from '../../../auth/domain/services/access-token.service';
import { AddFavoriteDto } from '../../application/dtos/add-favorite.dto';
import { FavoriteResponseDto } from '../../application/dtos/favorite-response.dto';
import { AddFavoriteUseCase } from '../../application/use-cases/add-favorite.use-case';
import { HydratedFavorite } from '../../application/use-cases/list-favorites.use-case';
import { ListFavoritesUseCase } from '../../application/use-cases/list-favorites.use-case';
import { RemoveFavoriteUseCase } from '../../application/use-cases/remove-favorite.use-case';
import { FavoriteEntity } from '../../domain/entities/favorite.entity';

function toResponse(favorite: FavoriteEntity, display: HydratedFavorite['display'] = null): FavoriteResponseDto {
  const response = new FavoriteResponseDto();
  response.id = favorite.id;
  response.entityType = favorite.entityType as FavoriteResponseDto['entityType'];
  response.entityId = favorite.entityId;
  response.createdAt = favorite.createdAt.toISOString();
  response.display = display;
  return response;
}

@ApiTags('Favorites')
@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(
    private readonly listFavoritesUseCase: ListFavoritesUseCase,
    private readonly addFavoriteUseCase: AddFavoriteUseCase,
    private readonly removeFavoriteUseCase: RemoveFavoriteUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: "List the current user's favorites, hydrated with display fields" })
  @ApiResponse({ status: 200, type: [FavoriteResponseDto] })
  async list(@CurrentUser() user: AccessTokenPayload): Promise<FavoriteResponseDto[]> {
    const hydrated = await this.listFavoritesUseCase.execute(user.sub);
    return hydrated.map(({ favorite, display }) => toResponse(favorite, display));
  }

  @Post()
  @ApiOperation({ summary: 'Add a favorite (idempotent — returns the existing row if already favorited)' })
  @ApiResponse({ status: 201, type: FavoriteResponseDto })
  async add(@CurrentUser() user: AccessTokenPayload, @Body() dto: AddFavoriteDto): Promise<FavoriteResponseDto> {
    const favorite = await this.addFavoriteUseCase.execute(user.sub, dto.entityType, dto.entityId);
    return toResponse(favorite);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a favorite owned by the current user' })
  @ApiResponse({ status: 204 })
  async remove(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string): Promise<void> {
    await this.removeFavoriteUseCase.execute(user.sub, id);
  }
}
