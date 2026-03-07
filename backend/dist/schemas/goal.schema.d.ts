import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from './user.schema';
export type GoalDocument = Goal & Document;
export declare class Goal {
    userId: MongooseSchema.Types.ObjectId | User;
    title: string;
    targetAmount: number;
    currentAmount: number;
    deadline: Date;
    category?: string;
    icon?: string;
}
export declare const GoalSchema: MongooseSchema<Goal, import("mongoose").Model<Goal, any, any, any, (Document<unknown, any, Goal, any, import("mongoose").DefaultSchemaOptions> & Goal & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, Goal, any, import("mongoose").DefaultSchemaOptions> & Goal & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}), any, Goal>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Goal, Document<unknown, {}, Goal, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Goal & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    userId?: import("mongoose").SchemaDefinitionProperty<User | MongooseSchema.Types.ObjectId, Goal, Document<unknown, {}, Goal, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Goal & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    title?: import("mongoose").SchemaDefinitionProperty<string, Goal, Document<unknown, {}, Goal, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Goal & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    targetAmount?: import("mongoose").SchemaDefinitionProperty<number, Goal, Document<unknown, {}, Goal, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Goal & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    currentAmount?: import("mongoose").SchemaDefinitionProperty<number, Goal, Document<unknown, {}, Goal, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Goal & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    deadline?: import("mongoose").SchemaDefinitionProperty<Date, Goal, Document<unknown, {}, Goal, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Goal & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    category?: import("mongoose").SchemaDefinitionProperty<string | undefined, Goal, Document<unknown, {}, Goal, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Goal & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    icon?: import("mongoose").SchemaDefinitionProperty<string | undefined, Goal, Document<unknown, {}, Goal, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Goal & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Goal>;
