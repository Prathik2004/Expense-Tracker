import { Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { GoogleSheetsSyncService } from './google-sheets-sync/google-sheets-sync.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly googleSheetsSyncService: GoogleSheetsSyncService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @UseGuards(JwtAuthGuard)
  @Post('admin/google-sheet-sync')
  async triggerGoogleSheetSync(@Request() req: any) {
    return this.googleSheetsSyncService.syncManual();
  }
}
