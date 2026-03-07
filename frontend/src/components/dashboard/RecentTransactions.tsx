"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface RecentTransactionsProps {
    transactions: any[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
    return (
        <Card className="col-span-full lg:col-span-4 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <CardTitle className="text-base font-medium">Recent Transactions</CardTitle>
                    <CardDescription>Your latest financial activity</CardDescription>
                </div>
                <Link href="/transactions" className="text-sm font-medium text-primary flex items-center hover:underline">
                    View all
                    <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
            </CardHeader>
            <CardContent className="flex-1">
                {transactions.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-zinc-500 dark:text-zinc-400">
                        No transactions found
                    </div>
                ) : (
                    <div className="space-y-4 mt-2">
                        {transactions.map((tx) => (
                            <div key={tx._id} className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">{tx.description || "No description"}</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-zinc-500">{format(new Date(tx.date), 'MMM dd, yyyy')}</span>
                                        <Badge variant="outline" className="text-[10px] font-normal h-4 px-1">{tx.category}</Badge>
                                    </div>
                                </div>
                                <div className={`text-sm font-semibold ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-500' : 'text-zinc-900 dark:text-zinc-100'}`}>
                                    {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
