import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) { }

    async findByEmail(email: string): Promise<UserDocument | null> {
        return this.userModel.findOne({ email }).exec();
    }

    async create(userData: Partial<User>): Promise<UserDocument> {
        if (!userData.email) throw new ConflictException('Email required');
        const existingUser = await this.findByEmail(userData.email);
        if (existingUser) {
            throw new ConflictException('Email already in use');
        }
        const createdUser = new this.userModel(userData);
        return createdUser.save();
    }

    async updatePortfolioValue(userId: string, portfolioValue: number): Promise<UserDocument | null> {
        return this.userModel.findByIdAndUpdate(
            userId,
            { portfolioValue },
            { new: true }
        ).exec();
    }
}
