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
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const transaction_schema_1 = require("../schemas/transaction.schema");
const user_schema_1 = require("../schemas/user.schema");
let TransactionsService = class TransactionsService {
    transactionModel;
    userModel;
    constructor(transactionModel, userModel) {
        this.transactionModel = transactionModel;
        this.userModel = userModel;
    }
    async create(userId, createTransactionDto) {
        const createdTransaction = new this.transactionModel({
            ...createTransactionDto,
            userId,
        });
        return createdTransaction.save();
    }
    async createBulk(userId, createTransactionDtos) {
        const transactionsToInsert = createTransactionDtos.map(dto => ({
            ...dto,
            userId,
        }));
        return this.transactionModel.insertMany(transactionsToInsert);
    }
    async findAll(userId, query) {
        const { page = 1, limit = 10, type, category, startDate, endDate, sort = 'date', order = 'desc' } = query;
        const filter = { userId };
        if (type)
            filter.type = type;
        if (category)
            filter.category = category;
        if (startDate || endDate) {
            filter.date = {};
            if (startDate)
                filter.date.$gte = new Date(startDate);
            if (endDate)
                filter.date.$lte = new Date(endDate);
        }
        const sortObj = {};
        sortObj[sort] = order === 'asc' ? 1 : -1;
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.transactionModel.find(filter).sort(sortObj).skip(skip).limit(Number(limit)).exec(),
            this.transactionModel.countDocuments(filter).exec()
        ]);
        return { data, total };
    }
    async findOne(userId, id) {
        const transaction = await this.transactionModel.findOne({ _id: id, userId }).exec();
        if (!transaction)
            throw new common_1.NotFoundException('Transaction not found');
        return transaction;
    }
    async update(userId, id, updateTransactionDto) {
        const transaction = await this.transactionModel.findOneAndUpdate({ _id: id, userId }, updateTransactionDto, { new: true }).exec();
        if (!transaction)
            throw new common_1.NotFoundException('Transaction not found');
        return transaction;
    }
    async remove(userId, id) {
        const result = await this.transactionModel.deleteOne({ _id: id, userId }).exec();
        if (result.deletedCount === 0)
            throw new common_1.NotFoundException('Transaction not found');
    }
    async getSummary(userId, month, year) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);
        const summary = await this.transactionModel.aggregate([
            { $match: { userId: new mongoose_2.Types.ObjectId(userId), date: { $gte: startDate, $lte: endDate } } },
            { $group: { _id: '$type', total: { $sum: '$amount' } } }
        ]);
        const income = summary.find(s => s._id === 'income')?.total || 0;
        const expense = summary.find(s => s._id === 'expense')?.total || 0;
        const investment = summary.find(s => s._id === 'investment')?.total || 0;
        const categoryBreakdown = await this.transactionModel.aggregate([
            { $match: { userId: new mongoose_2.Types.ObjectId(userId), type: 'expense', date: { $gte: startDate, $lte: endDate } } },
            { $group: { _id: '$category', total: { $sum: '$amount' } } },
            { $sort: { total: -1 } }
        ]);
        const user = await this.userModel.findById(userId);
        return {
            income,
            expense,
            investment,
            portfolioValue: user?.portfolioValue || 0,
            balance: income - expense - investment,
            categoryBreakdown
        };
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(transaction_schema_1.Transaction.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map