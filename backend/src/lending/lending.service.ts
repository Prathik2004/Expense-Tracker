import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Lending, LendingDocument } from '../schemas/lending.schema';
import { Transaction, TransactionDocument } from '../schemas/transaction.schema';
import { CreateLendingDto } from './dto/create-lending.dto';
import { UpdateLendingDto } from './dto/update-lending.dto';

@Injectable()
export class LendingService {
    constructor(
        @InjectModel(Lending.name) private lendingModel: Model<LendingDocument>,
        @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    ) { }

    async create(userId: string, createLendingDto: CreateLendingDto): Promise<LendingDocument> {
        const lending = new this.lendingModel({
            ...createLendingDto,
            userId,
        });

        if (createLendingDto.source === 'salary') {
            const transaction = new this.transactionModel({
                userId,
                type: 'expense',
                amount: createLendingDto.amount,
                category: 'Lending',
                description: `Lent to ${createLendingDto.personName} for ${createLendingDto.reason}`,
                date: createLendingDto.date,
            });
            const savedTransaction = await transaction.save();
            lending.transactionId = savedTransaction._id as any;
        }

        return lending.save();
    }

    async findAll(userId: string, query: any): Promise<{ data: LendingDocument[], total: number }> {
        const { page = 1, limit = 10, personName } = query;
        const filter: any = { userId };

        if (personName) {
            filter.personName = { $regex: personName, $options: 'i' };
        }

        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.lendingModel.find(filter).sort({ date: -1 }).skip(skip).limit(Number(limit)).exec(),
            this.lendingModel.countDocuments(filter).exec()
        ]);

        return { data, total };
    }

    async update(userId: string, id: string, updateLendingDto: UpdateLendingDto): Promise<LendingDocument> {
        const lending = await this.lendingModel.findOne({ _id: id, userId } as any).exec();
        if (!lending) throw new NotFoundException('Lending record not found');

        const oldSource = lending.source;
        const newSource = updateLendingDto.source || oldSource;

        // Handle Transaction linking/unlinking
        if (oldSource === 'salary' && newSource === 'other') {
            // Remove link
            if (lending.transactionId) {
                await this.transactionModel.deleteOne({ _id: lending.transactionId }).exec();
                lending.transactionId = undefined;
            }
        } else if (oldSource === 'other' && newSource === 'salary') {
            // Add link
            const transaction = new this.transactionModel({
                userId,
                type: 'expense',
                amount: updateLendingDto.amount || lending.amount,
                category: 'Lending',
                description: `Lent to ${updateLendingDto.personName || lending.personName} for ${updateLendingDto.reason || lending.reason}`,
                date: updateLendingDto.date || lending.date,
            });
            const savedTransaction = await transaction.save();
            lending.transactionId = savedTransaction._id as any;
        } else if (newSource === 'salary' && lending.transactionId) {
            // Update existing link
            await this.transactionModel.updateOne(
                { _id: lending.transactionId },
                {
                    amount: updateLendingDto.amount || lending.amount,
                    description: `Lent to ${updateLendingDto.personName || lending.personName} for ${updateLendingDto.reason || lending.reason}`,
                    date: updateLendingDto.date || lending.date,
                }
            ).exec();
        }

        Object.assign(lending, updateLendingDto);
        return lending.save();
    }

    async remove(userId: string, id: string): Promise<void> {
        const lending = await this.lendingModel.findOne({ _id: id, userId } as any).exec();
        if (!lending) throw new NotFoundException('Lending record not found');

        if (lending.transactionId) {
            await this.transactionModel.deleteOne({ _id: lending.transactionId }).exec();
        }

        await this.lendingModel.deleteOne({ _id: id }).exec();
    }
}
