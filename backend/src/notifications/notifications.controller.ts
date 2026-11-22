import { Controller, Get, Post, UseGuards, Request, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(@Request() req, @Query('limit') limit?: number) {
    const notifications = await this.notificationsService.getForUser(
      req.user.userId,
      limit ? Number(limit) : 50,
    );
    const unreadCount = await this.notificationsService.getUnreadCount(req.user.userId);
    return {
      notifications,
      unreadCount,
    };
  }

  @Post('mark-all-read')
  async markAllRead(@Request() req) {
    return this.notificationsService.markAllRead(req.user.userId);
  }
}
