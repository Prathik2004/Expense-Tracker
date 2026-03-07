"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoalsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const goal_schema_1 = require("../schemas/goal.schema");
let GoalsService = class GoalsService {
    goalModel;
    constructor(goalModel) {
        this.goalModel = goalModel;
    }
    async create(userId, createGoalDto) {
        const createdGoal = new this.goalModel({
            ...createGoalDto,
            userId,
        });
        return createdGoal.save();
    }
    async findAll(userId) {
        return this.goalModel.find({ userId }).exec();
    }
    async findOne(userId, id) {
        const goal = await this.goalModel.findOne({ _id: id, userId }).exec();
        if (!goal)
            throw new common_1.NotFoundException('Goal not found');
        return goal;
    }
    async update(userId, id, updateGoalDto) {
        const goal = await this.goalModel.findOneAndUpdate({ _id: id, userId }, updateGoalDto, { new: true }).exec();
        if (!goal)
            throw new common_1.NotFoundException('Goal not found');
        return goal;
    }
    async remove(userId, id) {
        const result = await this.goalModel.deleteOne({ _id: id, userId }).exec();
        if (result.deletedCount === 0)
            throw new common_1.NotFoundException('Goal not found');
    }
    async deposit(userId, id, amount) {
        const goal = await this.goalModel.findOneAndUpdate({ _id: id, userId }, { $inc: { currentAmount: amount } }, { new: true }).exec();
        if (!goal)
            throw new common_1.NotFoundException('Goal not found');
        return goal;
    }
};
exports.GoalsService = GoalsService;
exports.GoalsService = GoalsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(goal_schema_1.Goal.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], GoalsService);
//# sourceMappingURL=goals.service.js.map