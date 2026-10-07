"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, TrendingUp, History, Coins, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface GoalDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    goal: {
        _id: string;
        name?: string;
        title?: string;
        targetAmount: number;
        allocatedAmount: number;
        stillRequired: number;
        progress: number | null;
        status: string;
        bucket: string;
        deadline: string;
        category?: string;
        icon?: string;
    } | null;
}

const getStatusConfig = (status: string) => {
    switch (status) {
        case 'FUNDED':
            return { icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30', label: 'FUNDED' };
        case 'OVERDUE':
            return { icon: AlertTriangle, color: 'text-red-600 dark:text-red-500', bg: 'bg-red-100 dark:bg-red-900/30', label: 'OVERDUE' };
        case 'SET_TARGET':
            return { icon: Clock, color: 'text-amber-600 dark:text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30', label: 'SET TARGET' };
        case 'IN_PROGRESS':
        default:
            return { icon: Clock, color: 'text-blue-600 dark:text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'IN PROGRESS' };
    }
};

const getTypeConfig = (type: string) => {
    switch (type) {
        case 'INVEST':
            return { label: 'Invest', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/50', sign: '+' };
        case 'RETURN':
            return { label: 'Return', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/50', sign: '+' };
        case 'WITHDRAW':
            return { label: 'Withdraw', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/50', sign: '-' };
        default:
            return { label: type, color: 'text-zinc-500', bg: 'bg-zinc-50 dark:bg-zinc-950/50', sign: '' };
    }
};

export function GoalDetailsModal({ isOpen, onClose, goal }: GoalDetailsModalProps) {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && goal) {
            fetchTransactions();
        }
    }, [isOpen, goal]);

    const fetchTransactions = async () => {
        setIsLoading(true);
        try {
            const res = await api.get(`/liquid-funds/goals/${goal?._id}/transactions`);
            setTransactions(res.data);
        } catch (err) {
            console.error("Failed to fetch transactions", err);
        } finally {
            setIsLoading(false);
        }
    };

    if (!goal) return null;
    const goalName = goal.title || goal.name || "Goal";
    const percent = goal.progress !== null && goal.progress !== undefined
        ? Math.min(100, goal.progress * 100)
        : 0;
    const isCompleted = goal.status === 'FUNDED';
    const statusConfig = getStatusConfig(goal.status);
    const StatusIcon = statusConfig.icon;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] w-[95vw] p-4 sm:p-6 rounded-xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <div className="flex items-center space-x-2">
                        <div className="bg-primary/10 p-2 rounded-full">
                            <TrendingUp className="w-5 h-5 text-primary" />
                        </div>
                        <DialogTitle>{goalName}</DialogTitle>
                    </div>
                    <DialogDescription className="pt-1.5 flex items-center gap-2">
                        <span>Bucket: <span className="font-medium">{goal.bucket}</span></span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig.label}
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 mt-4 min-h-0 overflow-hidden flex flex-col">
                    {/* Goal Summary */}
                    <div className="space-y-4 mb-4 shrink-0">
                        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-lg">
                            <div className="flex justify-between text-sm font-medium mb-1.5">
                                <span className={isCompleted ? "text-emerald-600 dark:text-emerald-500" : ""}>
                                    ₹{goal.allocatedAmount.toLocaleString('en-IN')}
                                </span>
                                <span className="text-zinc-500">
                                    ₹{goal.targetAmount.toLocaleString('en-IN')}
                                </span>
                            </div>
                            <div className="flex justify-between text-xs text-zinc-500 mb-2">
                                <span>Remaining: ₹{goal.stillRequired.toLocaleString('en-IN')}</span>
                                <span>{percent.toFixed(0)}%</span>
                            </div>
                            <Progress value={percent} className="h-2" />
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-zinc-500">Target Date</span>
                                <div className="font-medium">{format(new Date(goal.deadline), "MMM d, yyyy")}</div>
                            </div>
                            <div>
                                <span className="text-zinc-500">Bucket</span>
                                <div className="font-medium">{goal.bucket}</div>
                            </div>
                        </div>
                    </div>

                    {/* Related Liquid Fund Transactions */}
                    <ScrollArea className="flex-1 -mx-4 px-4">
                        <div className="space-y-2 pb-4">
                            <h4 className="text-sm font-medium text-zinc-500 mb-3">Related Liquid Fund Transactions</h4>
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                                    <p className="text-zinc-500 text-sm">Loading transactions...</p>
                                </div>
                            ) : transactions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <History className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-3" />
                                    <h3 className="text-sm font-medium">No transactions yet</h3>
                                    <p className="text-xs text-zinc-500 mt-1 max-w-[200px]">
                                        Add liquid fund transactions linked to this goal to see them here.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {transactions.map((tx) => {
                                        const typeConfig = getTypeConfig(tx.transactionType);
                                        return (
                                            <div key={tx._id} className="flex items-start justify-between p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950/50 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900">
                                                <div className="flex flex-col flex-1 min-w-0">
                                                    <div className="flex items-center space-x-2 mb-1.5">
                                                        <Badge variant="secondary" className={`${typeConfig.bg} border-0 font-medium text-xs`}>
                                                            {typeConfig.label}
                                                        </Badge>
                                                        <span className="text-xs text-zinc-400">
                                                            {format(new Date(tx.date), "MMM d, yyyy")}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center space-x-2 text-xs text-zinc-500">
                                                        <span className="font-medium">{tx.fundName}</span>
                                                        <span className="text-zinc-400">•</span>
                                                        <span>{tx.bucket}</span>
                                                    </div>
                                                    {tx.notes && (
                                                        <p className="text-xs text-zinc-600 dark:text-zinc-400 italic line-clamp-2 mt-1">
                                                            "{tx.notes}"
                                                        </p>
                                                    )}
                                                </div>
                                                <div className={`text-right pl-3 shrink-0 ${typeConfig.color} font-semibold`}>
                                                    {typeConfig.sign}₹{tx.amount.toLocaleString('en-IN')}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}