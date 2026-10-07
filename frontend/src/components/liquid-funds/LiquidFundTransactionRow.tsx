"use client";

import { TrendingUp, ArrowUpCircle, ArrowDownCircle, Circle, X } from "lucide-react";

interface LiquidFundTransactionRowProps {
    transaction: {
        _id: string;
        date: string;
        fundName: string;
        bucket: string;
        transactionType: string;
        amount: number;
        goalId?: string | { _id: string; title: string; bucket: string };
        notes?: string;
    };
    onDelete: () => void;
}

export function LiquidFundTransactionRow({ transaction, onDelete }: LiquidFundTransactionRowProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const getTypeConfig = (type: string) => {
        switch (type) {
            case 'INVEST':
                return {
                    label: 'Invest',
                    color: 'text-emerald-600',
                    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
                    Icon: TrendingUp,
                };
            case 'RETURN':
                return {
                    label: 'Return',
                    color: 'text-blue-600',
                    bg: 'bg-blue-50 dark:bg-blue-950/50',
                    Icon: ArrowUpCircle,
                };
            case 'WITHDRAW':
                return {
                    label: 'Withdraw',
                    color: 'text-red-600',
                    bg: 'bg-red-50 dark:bg-red-950/50',
                    Icon: ArrowDownCircle,
                };
            default:
                return {
                    label: type,
                    color: 'text-zinc-500',
                    bg: 'bg-zinc-50 dark:bg-zinc-950/50',
                    Icon: Circle,
                };
        }
    };

    const typeConfig = getTypeConfig(transaction.transactionType);

    // Handle populated goal object or plain goalId string
    const goalTitle = transaction.goalId
        ? (typeof transaction.goalId === 'object' ? transaction.goalId.title : null)
        : null;

    return (
        <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-950/50">
            <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-700 dark:text-zinc-300">
                {formatDate(transaction.date)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                {transaction.fundName}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                {transaction.bucket}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className={`${typeConfig.bg} rounded-full px-2 py-0.5 text-xs font-medium inline-flex items-center gap-1`}>
                    <typeConfig.Icon className="w-3 h-3" />
                    {typeConfig.label}
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-zinc-100">
                ₹{transaction.amount.toLocaleString('en-IN')}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                {goalTitle ? (
                    <span className="font-medium">{goalTitle}</span>
                ) : (
                    <span className="italic text-zinc-400">No Goal</span>
                )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                {transaction.notes || <span className="italic text-zinc-400">-</span>}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                <button
                    onClick={onDelete}
                    className="text-destructive hover:text-destructive/80"
                    title="Delete"
                >
                    <X className="h-4 w-4" />
                </button>
            </td>
        </tr>
    );
}
