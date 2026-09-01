"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
    Edit2,
    Trash2,
    ArrowRight,
    ShoppingCart,
    Home,
    Briefcase,
    TrendingUp,
    TrendingDown,
    Car,
    Utensils,
    Dumbbell,
    Gamepad,
    BookOpen,
    Heart,
    Plane,
    Zap,
    Gift,
    CreditCard,
    Banknote,
    PiggyBank,
    Circle
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface RecentTransactionsProps {
    transactions: any[];
    onEdit?: (tx: any) => void;
    onDelete?: (id: string) => void;
}

const CATEGORY_ICONS: Record<string, { icon: any; bg: string; color: string }> = {
    food: { icon: Utensils, bg: 'bg-orange-100 dark:bg-orange-900/30', color: 'text-orange-600 dark:text-orange-400' },
    groceries: { icon: ShoppingCart, bg: 'bg-lime-100 dark:bg-lime-900/30', color: 'text-lime-600 dark:text-lime-400' },
    housing: { icon: Home, bg: 'bg-blue-100 dark:bg-blue-900/30', color: 'text-blue-600 dark:text-blue-400' },
    rent: { icon: Home, bg: 'bg-blue-100 dark:bg-blue-900/30', color: 'text-blue-600 dark:text-blue-400' },
    transport: { icon: Car, bg: 'bg-sky-100 dark:bg-sky-900/30', color: 'text-sky-600 dark:text-sky-400' },
    salary: { icon: Briefcase, bg: 'bg-emerald-100 dark:bg-emerald-900/30', color: 'text-emerald-600 dark:text-emerald-400' },
    investment: { icon: PiggyBank, bg: 'bg-violet-100 dark:bg-violet-900/30', color: 'text-violet-600 dark:text-violet-400' },
    health: { icon: Heart, bg: 'bg-rose-100 dark:bg-rose-900/30', color: 'text-rose-600 dark:text-rose-400' },
    entertainment: { icon: Gamepad, bg: 'bg-indigo-100 dark:bg-indigo-900/30', color: 'text-indigo-600 dark:text-indigo-400' },
    fitness: { icon: Dumbbell, bg: 'bg-amber-100 dark:bg-amber-900/30', color: 'text-amber-600 dark:text-amber-400' },
    education: { icon: BookOpen, bg: 'bg-teal-100 dark:bg-teal-900/30', color: 'text-teal-600 dark:text-teal-400' },
    travel: { icon: Plane, bg: 'bg-cyan-100 dark:bg-cyan-900/30', color: 'text-cyan-600 dark:text-cyan-400' },
    utilities: { icon: Zap, bg: 'bg-yellow-100 dark:bg-yellow-900/30', color: 'text-yellow-600 dark:text-yellow-400' },
    gifts: { icon: Gift, bg: 'bg-pink-100 dark:bg-pink-900/30', color: 'text-pink-600 dark:text-pink-400' },
    income: { icon: Banknote, bg: 'bg-emerald-100 dark:bg-emerald-900/30', color: 'text-emerald-600 dark:text-emerald-400' },
    credit: { icon: CreditCard, bg: 'bg-slate-100 dark:bg-slate-800', color: 'text-slate-600 dark:text-slate-400' },
};

function getCategoryMeta(category: string, type: string) {
    const key = category?.toLowerCase();
    if (CATEGORY_ICONS[key]) return CATEGORY_ICONS[key];
    if (type === 'income') return CATEGORY_ICONS['income'];
    return { icon: Circle, bg: 'bg-zinc-100 dark:bg-zinc-800', color: 'text-zinc-500' };
}

export function RecentTransactions({ transactions, onEdit, onDelete }: RecentTransactionsProps) {
    return (
        <Card className="col-span-full lg:col-span-4 flex flex-col card-glow">
            <CardHeader className="flex flex-row items-center justify-between pb-1">
                <div>
                    <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
                    <CardDescription className="mt-0.5">Your latest financial transactions</CardDescription>
                </div>
                <Link
                    href="/transactions"
                    className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                    View all
                    <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </CardHeader>
            <CardContent className="flex-1 pt-2">
                {transactions.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-muted-foreground py-12">
                        No transactions yet
                    </div>
                ) : (
                    <div className="space-y-1">
                        {transactions.map((tx) => {
                            const { icon: Icon, bg, color } = getCategoryMeta(tx.category, tx.type);
                            const isIncome = tx.type === 'income';
                            return (
                                <div
                                    key={tx._id}
                                    className="group flex items-center gap-3 px-3 py-2.5 -mx-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-colors border-l-2 border-transparent hover:border-l-primary/30"
                                >
                                    {/* Category icon */}
                                    <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                                        <Icon className={`w-4 h-4 ${color}`} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{tx.description || 'No description'}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs text-muted-foreground">{format(new Date(tx.date), 'MMM dd, yyyy')}</span>
                                            <Badge variant="outline" className="text-[10px] font-normal h-4 px-1.5 rounded-md">{tx.category}</Badge>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className={`text-sm font-semibold ${isIncome ? 'text-income' : tx.type === 'expense' ? 'text-expense' : 'text-investment'}`}>
                                            {isIncome ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </span>
                                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {onEdit && (
                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg" onClick={() => onEdit(tx)}>
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </Button>
                                            )}
                                            {onDelete && (
                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-rose-500 rounded-lg" onClick={() => onDelete(tx._id)}>
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
