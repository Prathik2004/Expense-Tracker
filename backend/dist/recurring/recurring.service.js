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
var RecurringService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecurringService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const transaction_schema_1 = require("../schemas/transaction.schema");
let RecurringService = RecurringService_1 = class RecurringService {
    transactionModel;
    logger = new common_1.Logger(RecurringService_1.name);
    constructor(transactionModel) {
        this.transactionModel = transactionModel;
    }
    async handleRecurringTransactions() {
        this.logger.debug('Running daily recurring transactions check');
        const today = new Date();
        const currentDay = today.getDate();
        const recurringTemplates = await this.transactionModel.find({
            isRecurring: true,
            recurringDay: currentDay,
        }).exec();
        this.logger.debug(`Found ${recurringTemplates.length} recurring templates for day ${currentDay}`);
        for (const template of recurringTemplates) {
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
            const alreadyProcessed = await this.transactionModel.exists({
                userId: template.userId,
                category: template.category,
                amount: template.amount,
                type: template.type,
                isRecurring: false,
                description: { $regex: /Auto-generated/ },
                date: { $gte: startOfMonth, $lte: endOfMonth }
            });
            if (!alreadyProcessed) {
                const newTx = new this.transactionModel({
                    userId: template.userId,
                    type: template.type,
                    amount: template.amount,
                    category: template.category,
                    description: `Auto-generated: ${template.description || 'Recurring transaction'}`,
                    date: new Date(),
                    isRecurring: false,
                });
                await newTx.save();
                this.logger.debug(`Generated new transaction for user ${template.userId.toString()}`);
            }
        }
    }
};
exports.RecurringService = RecurringService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RecurringService.prototype, "handleRecurringTransactions", null);
exports.RecurringService = RecurringService = RecurringService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(transaction_schema_1.Transaction.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], RecurringService);
//# sourceMappingURL=recurring.service.js.map