import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from './user.schema';
export type BudgetDocument = Budget & Document;
export declare class Budget {
    userId: MongooseSchema.Types.ObjectId | User;
    category: string;
    monthlyLimit: number;
    month: string;
}
export declare const BudgetSchema: MongooseSchema<Budget, import("mongoose").Model<Budget, any, any, any, (Document<unknown, any, Budget, any, import("mongoose").DefaultSchemaOptions> & Budget & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, Budget, any, import("mongoose").DefaultSchemaOptions> & Budget & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}), any, Budget>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Budget, Document<unknown, {}, Budget, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Budget & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    userId?: import("mongoose").SchemaDefinitionProperty<User | MongooseSchema.Types.ObjectId, Budget, Document<unknown, {}, Budget, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Budget & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    category?: import("mongoose").SchemaDefinitionProperty<string, Budget, Document<unknown, {}, Budget, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Budget & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    monthlyLimit?: import("mongoose").SchemaDefinitionProperty<number, Budget, Document<unknown, {}, Budget, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Budget & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    month?: import("mongoose").SchemaDefinitionProperty<string, Budget, Document<unknown, {}, Budget, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Budget & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Budget>;
