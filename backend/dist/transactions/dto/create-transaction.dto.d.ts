export declare class CreateTransactionDto {
    type: string;
    amount: number;
    category: string;
    description?: string;
    date?: Date;
    isRecurring?: boolean;
    recurringDay?: number;
}
