import { Body, Controller, Get, Headers, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { UnsubscribeDto } from './dto/unsubscribe.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { NotificationsQueryDto } from './dto/notifications-query.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('vapid-public-key')
  getPublicKey() {
    return { publicKey: this.notificationsService.getPublicKey() };
  }

  @UseGuards(JwtAuthGuard, ThrottlerGuard)
  @Post('subscribe')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  subscribe(@Request() req: any, @Body() dto: SubscribeDto, @Headers('user-agent') userAgent?: string) {
    return this.notificationsService.subscribe(req.user.userId, dto, userAgent);
  }

  @UseGuards(JwtAuthGuard)
  @Post('unsubscribe')
  unsubscribe(@Request() req: any, @Body() dto: UnsubscribeDto) {
    return this.notificationsService.unsubscribe(req.user.userId, dto.endpoint);
  }

  @UseGuards(JwtAuthGuard)
  @Get('subscriptions')
  subscriptions(@Request() req: any) {
    return this.notificationsService.listSubscriptions(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('preferences')
  getPreferences(@Request() req: any) { return this.notificationsService.getPreferences(req.user.userId); }

  @UseGuards(JwtAuthGuard)
  @Patch('preferences')
  updatePreferences(@Request() req: any, @Body() dto: UpdatePreferencesDto) { return this.notificationsService.updatePreferences(req.user.userId, dto); }

  @UseGuards(JwtAuthGuard)
  @Get()
  list(@Request() req: any, @Query() query: NotificationsQueryDto) { return this.notificationsService.list(req.user.userId, query.page, query.limit); }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/read')
  markRead(@Request() req: any, @Param('id') id: string) { return this.notificationsService.markRead(req.user.userId, id); }

  @UseGuards(JwtAuthGuard)
  @Patch('read-all')
  markAllRead(@Request() req: any) { return this.notificationsService.markAllRead(req.user.userId); }

  @UseGuards(JwtAuthGuard, ThrottlerGuard)
  @Post('test')
  @Throttle({ default: { limit: 15, ttl: 60_000 } })
  test(@Request() req: any) { return this.notificationsService.sendTest(req.user.userId); }
}
