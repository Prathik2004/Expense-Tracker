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
exports.BudgetsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const budget_schema_1 = require("../schemas/budget.schema");
const transaction_schema_1 = require("../schemas/transaction.schema");
let BudgetsService = class BudgetsService {
    budgetModel;
    transactionModel;
    constructor(budgetModel, transactionModel) {
        this.budgetModel = budgetModel;
        this.transactionModel = transactionModel;
    }
    async create(userId, createBudgetDto) {
        const existing = await this.budgetModel.findOne({
            userId: userId,
            category: createBudgetDto.category,
            month: createBudgetDto.month
        });
        if (existing) {
            existing.monthlyLimit = createBudgetDto.monthlyLimit;
            return existing.save();
        }
        const createdBudget = new this.budgetModel({
            ...createBudgetDto,
            userId,
        });
        return createdBudget.save();
    }
    async findAll(userId, month) {
        const query = { userId };
        if (month)
            query.month = month;
        const budgets = await this.budgetModel.find(query).exec();
        return Promise.all(budgets.map(async (budget) => {
            const [yearStr, monthStr] = budget.month.split('-');
            const year = parseInt(yearStr);
            const m = parseInt(monthStr);
            const startDate = new Date(year, m - 1, 1);
            const endDate = new Date(year, m, 0, 23, 59, 59, 999);
            const spentAgg = await this.transactionModel.aggregate([
                {
                    $match: {
                        userId: new mongoose_2.Types.ObjectId(userId),
                        type: 'expense',
                        category: budget.category,
                        date: { $gte: startDate, $lte: endDate }
                    }
                },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            const spent = spentAgg.length > 0 ? spentAgg[0].total : 0;
            return {
                ...budget.toObject(),
                spent
            };
        }));
    }
    async findOne(userId, id) {
        const budget = await this.budgetModel.findOne({ _id: id, userId }).exec();
        if (!budget)
            throw new common_1.NotFoundException('Budget not found');
        return budget;
    }
    async update(userId, id, updateBudgetDto) {
        const budget = await this.budgetModel.findOneAndUpdate({ _id: id, userId }, updateBudgetDto, { new: true }).exec();
        if (!budget)
            throw new common_1.NotFoundException('Budget not found');
        return budget;
    }
    async remove(userId, id) {
        const result = await this.budgetModel.deleteOne({ _id: id, userId }).exec();
        if (result.deletedCount === 0)
            throw new common_1.NotFoundException('Budget not found');
    }
};
exports.BudgetsService = BudgetsService;
exports.BudgetsService = BudgetsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(budget_schema_1.Budget.name)),
    __param(1, (0, mongoose_1.InjectModel)(transaction_schema_1.Transaction.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], BudgetsService);
//# sourceMappingURL=budgets.service.js.map