import { Controller, Get, Post, Body, UseGuards, Request, Headers, ForbiddenException } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { CreatePortfolioEntryDto } from './dto/create-portfolio-entry.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('portfolio')
export class PortfolioController {
    constructor(private readonly portfolioService: PortfolioService) { }

    @UseGuards(JwtAuthGuard)
    @Post('bulk')
    createBulk(@Request() req: any, @Body() dtos: CreatePortfolioEntryDto[]) {
        return this.portfolioService.createBulk(req.user.userId, dtos);
    }

    @UseGuards(JwtAuthGuard)
    @Post('sync/manual')
    manualSync(@Request() req: any) {
        return this.portfolioService.manualSync(req.user.userId);
    }

    @Post('sync/cron')
    cronSync(@Headers('x-portfolio-sync-secret') secret?: string) {
        const expectedSecret = process.env.PORTFOLIO_SYNC_SECRET;

        if (expectedSecret && secret !== expectedSecret) {
            throw new ForbiddenException('Invalid sync secret');
        }

        return this.portfolioService.syncPortfolioForCron();
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    getPortfolio(@Request() req: any) {
        return this.portfolioService.getPortfolio(req.user.userId);
    }
}
