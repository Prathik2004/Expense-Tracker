import { Document, Types } from 'mongoose';
export type PortfolioEntryDocument = PortfolioEntry & Document;
export declare class PortfolioEntry {
    userId: Types.ObjectId;
    category: string;
    amount: number;
    description: string;
    date: Date;
}
export declare const PortfolioEntrySchema: import("mongoose").Schema<PortfolioEntry, import("mongoose").Model<PortfolioEntry, any, any, any, (Document<unknown, any, PortfolioEntry, any, import("mongoose").DefaultSchemaOptions> & PortfolioEntry & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, PortfolioEntry, any, import("mongoose").DefaultSchemaOptions> & PortfolioEntry & {
    _id: Types.ObjectId;
} & {
    __v: number;
}), any, PortfolioEntry>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, PortfolioEntry, Document<unknown, {}, PortfolioEntry, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<PortfolioEntry & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    userId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, PortfolioEntry, Document<unknown, {}, PortfolioEntry, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PortfolioEntry & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    category?: import("mongoose").SchemaDefinitionProperty<string, PortfolioEntry, Document<unknown, {}, PortfolioEntry, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PortfolioEntry & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    amount?: import("mongoose").SchemaDefinitionProperty<number, PortfolioEntry, Document<unknown, {}, PortfolioEntry, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PortfolioEntry & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    description?: import("mongoose").SchemaDefinitionProperty<string, PortfolioEntry, Document<unknown, {}, PortfolioEntry, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PortfolioEntry & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    date?: import("mongoose").SchemaDefinitionProperty<Date, PortfolioEntry, Document<unknown, {}, PortfolioEntry, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PortfolioEntry & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, PortfolioEntry>;
