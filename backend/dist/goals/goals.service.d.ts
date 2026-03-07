import { Model } from 'mongoose';
import { GoalDocument } from '../schemas/goal.schema';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
export declare class GoalsService {
    private goalModel;
    constructor(goalModel: Model<GoalDocument>);
    create(userId: string, createGoalDto: CreateGoalDto): Promise<GoalDocument>;
    findAll(userId: string): Promise<GoalDocument[]>;
    findOne(userId: string, id: string): Promise<GoalDocument>;
    update(userId: string, id: string, updateGoalDto: UpdateGoalDto): Promise<GoalDocument>;
    remove(userId: string, id: string): Promise<void>;
    deposit(userId: string, id: string, amount: number): Promise<GoalDocument>;
}
