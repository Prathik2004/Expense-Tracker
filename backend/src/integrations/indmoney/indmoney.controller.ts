import { Controller, Get, Req, Res, UseGuards, Post, Delete, Body } from '@nestjs/common';
import { IndmoneyService } from './indmoney.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('integrations/indmoney')
export class IndmoneyController {
  constructor(private svc: IndmoneyService) {}

  @UseGuards(JwtAuthGuard)
  @Get('connect')
  async connect(@Req() req: any) {
    const userId = req.user && req.user._id ? req.user._id.toString() : req.user?.id || null;
    const resp = await this.svc.buildAuthorizeUrlForUser(userId);
    return { url: resp.url };
  }

  // This callback is intended to be called by INDmoney redirecting to the backend
  @Get('callback')
  async callback(@Req() req: any, @Res() res: any) {
    const { code, state, error } = req.query;
    if (error) {
      return res.status(400).send('Authorization denied');
    }

    if (!code || !state) return res.status(400).send('Missing code or state');

    try {
      await this.svc.handleCallback(code, state);
      // Redirect user back to frontend success page if configured
      const redirectTo = process.env.INDMONEY_POST_CONNECT_REDIRECT || '/settings/integrations';
      return res.redirect(redirectTo);
    } catch (err: any) {
      return res.status(500).send(err?.message || 'Callback handling failed');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('status')
  async status(@Req() req: any) {
    const userId = req.user && req.user._id ? req.user._id.toString() : req.user?.id || null;
    return this.svc.getStatusForUser(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('sync')
  async sync(@Req() req: any) {
    const userId = req.user && req.user._id ? req.user._id.toString() : req.user?.id || null;
    return this.svc.manualSync(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete()
  async disconnect(@Req() req: any) {
    const userId = req.user && req.user._id ? req.user._id.toString() : req.user?.id || null;
    return this.svc.disconnectUser(userId);
  }
}
