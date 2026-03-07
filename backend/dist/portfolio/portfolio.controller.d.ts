import { PortfolioService } from './portfolio.service';
import { CreatePortfolioEntryDto } from './dto/create-portfolio-entry.dto';
export declare class PortfolioController {
    private readonly portfolioService;
    constructor(portfolioService: PortfolioService);
    createBulk(req: any, dtos: CreatePortfolioEntryDto[]): Promise<any>;
    getPortfolio(req: any): Promise<any>;
}
