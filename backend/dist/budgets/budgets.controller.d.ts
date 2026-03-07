import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
export declare class BudgetsController {
    private readonly budgetsService;
    constructor(budgetsService: BudgetsService);
    create(req: any, createBudgetDto: CreateBudgetDto): Promise<import("../schemas/budget.schema").BudgetDocument>;
    findAll(req: any, month?: string): Promise<any[]>;
    findOne(req: any, id: string): Promise<import("../schemas/budget.schema").BudgetDocument>;
    update(req: any, id: string, updateBudgetDto: UpdateBudgetDto): Promise<import("../schemas/budget.schema").BudgetDocument>;
    remove(req: any, id: string): Promise<void>;
}
