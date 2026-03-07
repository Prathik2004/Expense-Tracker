"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AddBudgetModal } from "@/components/budgets/AddBudgetModal";
import { Loader2, Plus, PieChart, Trash2, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default function BudgetsPage() {
    const [budgets, setBudgets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const currentMonth = format(new Date(), 'yyyy-MM');
    const currentMonthDisplay = format(new Date(), 'MMMM yyyy');

    useEffect(() => {
        fetchBudgets();
    }, []);

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
        if (!confirm("Are you sure you want to remove this budget?")) return;
        try {
            await api.delete(`/budgets/${id}`);
            setBudgets(budgets.filter((b) => b._id !== id));
        } catch (err) {
            console.error("Failed to delete budget", err);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                        Tracking limits for {currentMonthDisplay}.
                    </p>
                </div>
                <Button onClick={() => setIsAddOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Budget
                </Button>
            </div>

            {isLoading ? (
                <div className="flex h-40 items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : budgets.length === 0 ? (
                <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
                    <PieChart className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-4" />
                    <h3 className="text-lg font-medium">No budgets set</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1 mb-4">
                        Create limits for your spending categories to get warnings when you overspend.
                    </p>
                    <Button onClick={() => setIsAddOpen(true)} variant="outline">
                        Set Budget
                    </Button>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {budgets.map((budget) => {
                        const spent = budget.spent || 0;
                        const limit = budget.monthlyLimit;
                        const percent = Math.min(100, (spent / limit) * 100);

                        const isOverBudget = spent >= limit;
                        const isWarning = percent >= 80 && !isOverBudget;

                        return (
                            <Card
                                key={budget._id}
                                className={`overflow-hidden transition-all ${isOverBudget ? 'border-rose-500/50 bg-rose-50/30 dark:bg-rose-950/10' : ''}`}
                            >
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <CardTitle className="text-lg font-semibold">{budget.category}</CardTitle>
                                            {isOverBudget && <AlertCircle className="w-4 h-4 text-rose-500" />}
                                        </div>
                                        <button
                                            onClick={() => handleDelete(budget._id)}
                                            className="text-zinc-400 hover:text-destructive transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <CardDescription>
                                        {isOverBudget
                                            ? <span className="text-rose-600 dark:text-rose-400 font-medium">Over budget by ₹{(spent - limit).toLocaleString('en-IN')}</span>
                                            : isWarning
                                                ? <span className="text-amber-600 dark:text-amber-500 font-medium">Nearing limit. ₹{(limit - spent).toLocaleString('en-IN')} remaining</span>
                                                : <span>₹{(limit - spent).toLocaleString('en-IN')} remaining</span>
                                        }
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 mt-2">
                                        <div className="flex justify-between text-sm font-medium">
                                            <span>Spent: ₹{spent.toLocaleString('en-IN')}</span>
                                            <span className="text-zinc-500">
                                                Limit: ₹{limit.toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                        <div className="relative pt-1">
                                            <Progress
                                                value={percent}
                                                className={`h-3 ${isOverBudget ? '[&>div]:bg-rose-500' : isWarning ? '[&>div]:bg-amber-500' : ''}`}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            <AddBudgetModal
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                onSuccess={fetchBudgets}
            />
        </div>
    );
}
