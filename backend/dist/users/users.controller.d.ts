import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    updatePortfolio(req: any, portfolioValue: number): Promise<{
        portfolioValue: number | undefined;
    }>;
}
