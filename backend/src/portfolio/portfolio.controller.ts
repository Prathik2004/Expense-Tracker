import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { CreatePortfolioEntryDto } from './dto/create-portfolio-entry.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('portfolio')
export class PortfolioController {
    constructor(private readonly portfolioService: PortfolioService) { }

    @Post('bulk')
    createBulk(@Request() req: any, @Body() dtos: CreatePortfolioEntryDto[]) {
        return this.portfolioService.createBulk(req.user.userId, dtos);
    }

    @Get()
    getPortfolio(@Request() req: any) {
        return this.portfolioService.getPortfolio(req.user.userId);
    }
}
