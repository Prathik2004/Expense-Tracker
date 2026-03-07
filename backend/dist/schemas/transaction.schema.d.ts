import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from './user.schema';
export type TransactionDocument = Transaction & Document;
export declare class Transaction {
    userId: MongooseSchema.Types.ObjectId | User;
    type: string;
    amount: number;
    category: string;
    description: string;
    date: Date;
    isRecurring: boolean;
    recurringDay?: number;
}
export declare const TransactionSchema: MongooseSchema<Transaction, import("mongoose").Model<Transaction, any, any, any, (Document<unknown, any, Transaction, any, import("mongoose").DefaultSchemaOptions> & Transaction & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, Transaction, any, import("mongoose").DefaultSchemaOptions> & Transaction & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}), any, Transaction>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Transaction, Document<unknown, {}, Transaction, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Transaction & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    userId?: import("mongoose").SchemaDefinitionProperty<User | MongooseSchema.Types.ObjectId, Transaction, Document<unknown, {}, Transaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Transaction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    type?: import("mongoose").SchemaDefinitionProperty<string, Transaction, Document<unknown, {}, Transaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Transaction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    amount?: import("mongoose").SchemaDefinitionProperty<number, Transaction, Document<unknown, {}, Transaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Transaction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    category?: import("mongoose").SchemaDefinitionProperty<string, Transaction, Document<unknown, {}, Transaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Transaction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    description?: import("mongoose").SchemaDefinitionProperty<string, Transaction, Document<unknown, {}, Transaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Transaction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    date?: import("mongoose").SchemaDefinitionProperty<Date, Transaction, Document<unknown, {}, Transaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Transaction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isRecurring?: import("mongoose").SchemaDefinitionProperty<boolean, Transaction, Document<unknown, {}, Transaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Transaction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    recurringDay?: import("mongoose").SchemaDefinitionProperty<number | undefined, Transaction, Document<unknown, {}, Transaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Transaction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Transaction>;
