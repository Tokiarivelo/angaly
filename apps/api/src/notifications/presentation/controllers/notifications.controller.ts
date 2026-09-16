import { Controller, Get, HttpCode, HttpStatus, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import type { AccessTokenPayload } from '../../../auth/domain/services/access-token.service';
import { NotificationResponseDto } from '../../application/dtos/notification-response.dto';
import { ListUserNotificationsUseCase } from '../../application/use-cases/list-user-notifications.use-case';
import { MarkAllReadUseCase } from '../../application/use-cases/mark-all-read.use-case';
import { MarkNotificationReadUseCase } from '../../application/use-cases/mark-notification-read.use-case';
import { NotificationMapper } from '../../infrastructure/mappers/notification.mapper';

/** All routes require an authenticated user — every notification belongs to a single `User`. */
@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class NotificationsController {
  constructor(
    private readonly listUserNotificationsUseCase: ListUserNotificationsUseCase,
    private readonly markNotificationReadUseCase: MarkNotificationReadUseCase,
    private readonly markAllReadUseCase: MarkAllReadUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: "List the current user's notifications, newest first" })
  @ApiQuery({ name: 'unread', required: false, type: Boolean })
  @ApiResponse({ status: 200, type: [NotificationResponseDto] })
  async list(@CurrentUser() user: AccessTokenPayload, @Query('unread') unread?: string): Promise<NotificationResponseDto[]> {
    const notifications = await this.listUserNotificationsUseCase.execute(user.sub, unread === 'true');
    return notifications.map((notification) => NotificationMapper.toResponseDto(notification));
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark one notification as read (owner only)' })
  @ApiResponse({ status: 200, type: NotificationResponseDto })
  async markRead(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string): Promise<NotificationResponseDto> {
    const notification = await this.markNotificationReadUseCase.execute(id, user.sub);
    return NotificationMapper.toResponseDto(notification);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Mark every one of the current user's notifications as read" })
  @ApiResponse({ status: 204 })
  async markAllRead(@CurrentUser() user: AccessTokenPayload): Promise<void> {
    await this.markAllReadUseCase.execute(user.sub);
  }
}
