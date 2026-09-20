import { Controller, Patch, Body, UseGuards, Req, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Patch('portfolio')
    async updatePortfolio(@Req() req: any, @Body('portfolioValue') portfolioValue: number) {
        const user = await this.usersService.updatePortfolioValue(req.user.userId, portfolioValue);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return { portfolioValue: user.portfolioValue };
    }

    @Patch('portfolio-sync-url')
    async updatePortfolioSyncUrl(@Req() req: any, @Body('portfolioSyncUrl') portfolioSyncUrl: string) {
        const user = await this.usersService.updatePortfolioSyncUrl(req.user.userId, portfolioSyncUrl);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return { portfolioSyncUrl: user.portfolioSyncUrl };
    }
}
