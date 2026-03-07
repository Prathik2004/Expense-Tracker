import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
export declare class GoalsController {
    private readonly goalsService;
    constructor(goalsService: GoalsService);
    create(req: any, createGoalDto: CreateGoalDto): Promise<import("../schemas/goal.schema").GoalDocument>;
    findAll(req: any): Promise<import("../schemas/goal.schema").GoalDocument[]>;
    findOne(req: any, id: string): Promise<import("../schemas/goal.schema").GoalDocument>;
    update(req: any, id: string, updateGoalDto: UpdateGoalDto): Promise<import("../schemas/goal.schema").GoalDocument>;
    remove(req: any, id: string): Promise<void>;
    deposit(req: any, id: string, amount: number): Promise<import("../schemas/goal.schema").GoalDocument>;
}
