"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
    Edit2,
    Trash2,
    ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface RecentTransactionsProps {
    transactions: any[];
    onEdit?: (tx: any) => void;
    onDelete?: (id: string) => void;
}

export function RecentTransactions({ transactions, onEdit, onDelete }: RecentTransactionsProps) {
    return (
        <Card className="col-span-full lg:col-span-4 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
                    <CardDescription>Your latest financial activity</CardDescription>
                </div>
                <Link href="/transactions" className="text-sm font-medium text-primary flex items-center hover:underline">
                    View all
                    <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
            </CardHeader>
            <CardContent className="flex-1">
                {transactions.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-zinc-500 dark:text-zinc-400 py-8">
                        No transactions found
                    </div>
                ) : (
                    <div className="space-y-4 mt-2">
                        {transactions.map((tx) => (
                            <div key={tx._id} className="group flex items-center justify-between p-2 -mx-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                                <div className="flex flex-col flex-1 min-w-0">
                                    <span className="text-sm font-medium truncate">{tx.description || "No description"}</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-zinc-500">{format(new Date(tx.date), 'MMM dd, yyyy')}</span>
                                        <Badge variant="outline" className="text-[10px] font-normal h-4 px-1">{tx.category}</Badge>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className={`text-sm font-semibold whitespace-nowrap ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-500' : 'text-zinc-900 dark:text-zinc-100'}`}>
                                        {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </div>
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {onEdit && (
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100" onClick={() => onEdit(tx)}>
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </Button>
                                        )}
                                        {onDelete && (
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-rose-500" onClick={() => onDelete(tx._id)}>
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
