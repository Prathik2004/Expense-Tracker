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
exports.PortfolioService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const portfolio_entry_schema_1 = require("../schemas/portfolio-entry.schema");
const transaction_schema_1 = require("../schemas/transaction.schema");
const user_schema_1 = require("../schemas/user.schema");
let PortfolioService = class PortfolioService {
    portfolioEntryModel;
    transactionModel;
    userModel;
    constructor(portfolioEntryModel, transactionModel, userModel) {
        this.portfolioEntryModel = portfolioEntryModel;
        this.transactionModel = transactionModel;
        this.userModel = userModel;
    }
    async createBulk(userId, dtos) {
        const entries = dtos.map(dto => ({
            ...dto,
            userId: new mongoose_2.Types.ObjectId(userId),
        }));
        return this.portfolioEntryModel.insertMany(entries);
    }
    async getPortfolio(userId) {
        const transactionInvestments = await this.transactionModel.aggregate([
            { $match: { userId: new mongoose_2.Types.ObjectId(userId), type: 'investment' } },
            { $group: { _id: '$category', total: { $sum: '$amount' } } }
        ]);
        const manualEntries = await this.portfolioEntryModel.aggregate([
            { $match: { userId: new mongoose_2.Types.ObjectId(userId) } },
            { $group: { _id: '$category', total: { $sum: '$amount' } } }
        ]);
        const categoriesMap = {};
        transactionInvestments.forEach(item => {
            const cat = item._id || 'Other';
            categoriesMap[cat] = (categoriesMap[cat] || 0) + item.total;
        });
        manualEntries.forEach(item => {
            const cat = item._id || 'Other';
            categoriesMap[cat] = (categoriesMap[cat] || 0) + item.total;
        });
        let totalInvestedAllTime = 0;
        const holdings = Object.entries(categoriesMap).map(([category, amount]) => {
            totalInvestedAllTime += amount;
            return { category, amount };
        });
        const user = await this.userModel.findById(userId);
        return {
            totalInvested: totalInvestedAllTime,
            portfolioValue: user?.portfolioValue || 0,
            holdings: holdings.sort((a, b) => b.amount - a.amount)
        };
    }
};
exports.PortfolioService = PortfolioService;
exports.PortfolioService = PortfolioService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(portfolio_entry_schema_1.PortfolioEntry.name)),
    __param(1, (0, mongoose_1.InjectModel)(transaction_schema_1.Transaction.name)),
    __param(2, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], PortfolioService);
//# sourceMappingURL=portfolio.service.js.map