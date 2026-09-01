"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddBudgetModal } from "@/components/budgets/AddBudgetModal";
import { Loader2, Plus, PieChart, Trash2, AlertTriangle, CheckCircle2, TrendingDown } from "lucide-react";
import { format } from "date-fns";

function CircleProgress({ percent, isOver, isWarning }: { percent: number; isOver: boolean; isWarning: boolean }) {
    const r = 34;
    const circ = 2 * Math.PI * r;
    const filled = Math.min(100, percent) / 100 * circ;
    const color = isOver ? '#e53e3e' : isWarning ? '#d97706' : '#16a34a';

    return (
        <div className="relative w-20 h-20 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 76 76">
                <circle cx="38" cy="38" r={r} fill="none" stroke="currentColor" strokeWidth="5" className="text-muted" />
                <circle
                    cx="38" cy="38" r={r} fill="none"
                    stroke={color}
                    strokeWidth="5"
                    strokeDasharray={`${filled} ${circ}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 0.5s ease' }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-foreground">{Math.round(percent)}%</span>
            </div>
        </div>
    );
}

export default function BudgetsPage() {
    const [budgets, setBudgets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const currentMonth = format(new Date(), 'yyyy-MM');
    const currentMonthDisplay = format(new Date(), 'MMMM yyyy');

    useEffect(() => { fetchBudgets(); }, []);

    const fetchBudgets = async () => {
        try {
            const res = await api.get(`/budgets?month=${currentMonth}`);
            setBudgets(res.data);
        } catch (err) {
            console.error("Failed to fetch budgets", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Remove this budget?")) return;
        try {
            await api.delete(`/budgets/${id}`);
            setBudgets(budgets.filter((b) => b._id !== id));
        } catch (err) {
            console.error("Failed to delete budget", err);
        }
    };

    const overCount = budgets.filter(b => (b.spent || 0) >= b.monthlyLimit).length;
    const warnCount = budgets.filter(b => {
        const p = (b.spent || 0) / b.monthlyLimit * 100;
        return p >= 80 && p < 100;
    }).length;

    return (
        <div className="space-y-5 animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">Budgets</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {currentMonthDisplay}
                    </p>
                </div>
                <Button
                    onClick={() => setIsAddOpen(true)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 rounded-lg text-sm font-medium border-0"
                >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Add Budget
                </Button>
            </div>

            {/* Summary row */}
            {budgets.length > 0 && !isLoading && (
                <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-full text-xs font-medium text-muted-foreground">
                        {budgets.length} budget{budgets.length !== 1 ? 's' : ''}
                    </div>
                    {overCount > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-950/30 rounded-full text-xs font-medium text-red-600 dark:text-red-400">
                            <AlertTriangle className="w-3 h-3" />
                            {overCount} over budget
                        </div>
                    )}
                    {warnCount > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/30 rounded-full text-xs font-medium text-amber-600 dark:text-amber-400">
                            <TrendingDown className="w-3 h-3" />
                            {warnCount} near limit
                        </div>
                    )}
                </div>
            )}

            {isLoading ? (
                <div className="flex h-40 items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
            ) : budgets.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-14 text-center border border-dashed border-border rounded-xl bg-muted/20">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                        <PieChart className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">No budgets set</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                        Create spending limits to get alerts before you overspend.
                    </p>
                    <Button onClick={() => setIsAddOpen(true)} variant="outline" className="mt-4 h-8 rounded-lg text-xs">
                        Set your first budget
                    </Button>
                </div>
            ) : (
                <div className="grid gap-3 md:grid-cols-2 stagger-children">
                    {budgets.map((budget) => {
                        const spent = budget.spent || 0;
                        const limit = budget.monthlyLimit;
                        const percent = (spent / limit) * 100;
                        const isOverBudget = spent >= limit;
                        const isWarning = percent >= 80 && !isOverBudget;
                        const remaining = limit - spent;

                        return (
                            <Card key={budget._id} className={`card-base ${isOverBudget ? 'border-red-200 dark:border-red-800/40 bg-red-50/50 dark:bg-red-950/20' : isWarning ? 'border-amber-200 dark:border-amber-800/40' : ''}`}>
                                <CardContent className="pt-5 pb-5 px-5">
                                    <div className="flex items-start gap-4">
                                        <CircleProgress percent={percent} isOver={isOverBudget} isWarning={isWarning} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="text-sm font-semibold text-foreground">{budget.category}</h3>
                                                <button
                                                    onClick={() => handleDelete(budget._id)}
                                                    className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-md hover:bg-muted shrink-0"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            {isOverBudget ? (
                                                <div className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    Over by ₹{(spent - limit).toLocaleString('en-IN')}
                                                </div>
                                            ) : isWarning ? (
                                                <div className="mt-1 flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                                                    <TrendingDown className="w-3 h-3" />
                                                    ₹{remaining.toLocaleString('en-IN')} left
                                                </div>
                                            ) : (
                                                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                    ₹{remaining.toLocaleString('en-IN')} remaining
                                                </div>
                                            )}

                                            <div className="mt-3 flex items-baseline justify-between">
                                                <div>
                                                    <span className={`text-lg font-bold ${isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>
                                                        ₹{spent.toLocaleString('en-IN')}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground ml-1">spent</span>
                                                </div>
                                                <span className="text-sm text-muted-foreground">/ ₹{limit.toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            <AddBudgetModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onSuccess={fetchBudgets} />
        </div>
    );
}