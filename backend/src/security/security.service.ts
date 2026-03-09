import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Session, SessionDocument } from '../schemas/session.schema';

@Injectable()
export class SecurityService {
    constructor(
        @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
    ) { }

    private readonly adminEmail = 'prathik1611@gmail.com';

    private validateAdmin(email: string) {
        if (email !== this.adminEmail) {
            throw new ForbiddenException('Admin access only');
        }
    }

    async getAllSessions(email: string) {
        this.validateAdmin(email);
        return this.sessionModel.find({ isValid: true })
            .populate('userId', 'name email')
            .sort({ lastActive: -1 })
            .exec();
    }

    async revokeSession(email: string, sessionId: string) {
        this.validateAdmin(email);
        return this.sessionModel.findOneAndUpdate(
            { sessionId },
            { isValid: false },
            { new: true }
        ).exec();
    }

    async revokeOtherSessions(email: string, userId: string, currentSessionId: string) {
        this.validateAdmin(email);
        return this.sessionModel.updateMany(
            { userId, sessionId: { $ne: currentSessionId }, isValid: true },
            { isValid: false }
        ).exec();
    }

    async handleLogout(sessionId: string) {
        return this.sessionModel.findOneAndUpdate(
            { sessionId },
            { isValid: false },
            { new: true }
        ).exec();
    }
}
