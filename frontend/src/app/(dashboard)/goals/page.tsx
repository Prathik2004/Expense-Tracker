"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AddGoalModal } from "@/components/goals/AddGoalModal";
import { AddLiquidFundModal } from "@/components/liquid-funds/AddLiquidFundModal";
import { GoalDetailsModal } from "@/components/goals/GoalDetailsModal";
import { Loader2, Plus, Target, Trash2, List, AlertTriangle, CheckCircle, Clock } from "lucide-react";

export default function GoalsPage() {
    const [goals, setGoals] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);

    // Add Liquid Fund Modal state
    const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState<any>(null);

    // Details Modal state
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedDetailsGoal, setSelectedDetailsGoal] = useState<any>(null);

    // Summary state
    const [summary, setSummary] = useState({ totalTargets: 0, totalAllocated: 0, stillRequired: 0 });
    const [isSummaryLoading, setIsSummaryLoading] = useState(true);

    useEffect(() => {
        fetchGoals();
        fetchSummary();
    }, []);

    const fetchGoals = async () => {
        try {
            const res = await api.get("/goals");
            setGoals(res.data);
        } catch (err) {
            console.error("Failed to fetch goals", err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSummary = async () => {
        try {
            const res = await api.get("/goals/summary");
            setSummary(res.data);
        } catch (err) {
            console.error("Failed to fetch goals summary", err);
        } finally {
            setIsSummaryLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this goal?")) return;
        try {
            await api.delete(`/goals/${id}`);
            setGoals(goals.filter((g) => g._id !== id));
            fetchSummary();
        } catch (err) {
            console.error("Failed to delete goal", err);
        }
    };

    const handleOpenContribute = (goal: any) => {
        setSelectedGoal(goal);
        setIsAddFundsOpen(true);
    };

    const handleOpenDetails = (goal: any) => {
        setSelectedDetailsGoal(goal);
        setIsDetailsOpen(true);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Financial Goals</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                        Track your savings targets.
                    </p>
                </div>
                <Button onClick={() => setIsAddOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Goal
                </Button>
            </div>

            {/* Summary Cards */}
            {!isSummaryLoading && (
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-zinc-500">Total Targets</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₹{(summary.totalTargets ?? 0).toLocaleString('en-IN')}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-zinc-500">Total Allocated</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">₹{(summary.totalAllocated ?? 0).toLocaleString('en-IN')}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-zinc-500">Still Required</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-600 dark:text-amber-500">₹{(summary.stillRequired ?? 0).toLocaleString('en-IN')}</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {isLoading ? (
                <div className="flex h-40 items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : goals.length === 0 ? (
                <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
                    <Target className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-4" />
                    <h3 className="text-lg font-medium">No goals yet</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1 mb-4">
                        Set your first savings target to stay on track.
                    </p>
                    <Button onClick={() => setIsAddOpen(true)} variant="outline">
                        Create Goal
                    </Button>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {goals.map((goal) => {
                        const percent = goal.progress !== null && goal.progress !== undefined
                            ? Math.min(100, goal.progress * 100)
                            : 0;
                        const isCompleted = goal.status === 'FUNDED';
                        const goalName = goal.title || goal.name;
                        const statusConfig = getStatusConfig(goal.status);
                        const StatusIcon = statusConfig.icon;

                        return (
                            <Card key={goal._id} className={isCompleted ? "border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20" : ""}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg font-semibold">{goalName}</CardTitle>
                                        <button
                                            onClick={() => handleDelete(goal._id)}
                                            className="text-zinc-400 hover:text-destructive transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <CardDescription>
                                            By {formatDate(goal.deadline)}
                                        </CardDescription>
                                        <span
                                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}
                                        >
                                            <StatusIcon className="w-3 h-3 mr-1" />
                                            {statusConfig.label}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-sm font-medium mb-1.5">
                                            <span className={isCompleted ? "text-emerald-600 dark:text-emerald-500" : ""}>
                                                ₹{(goal.allocatedAmount ?? 0).toLocaleString('en-IN')}
                                            </span>
                                            <span className="text-zinc-500">
                                                ₹{(goal.targetAmount ?? 0).toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-xs text-zinc-500 mb-1">
                                            <span>Remaining: ₹{(goal.stillRequired ?? 0).toLocaleString('en-IN')}</span>
                                            <span>{percent.toFixed(0)}%</span>
                                        </div>
                                        <Progress value={percent} className="h-2" />
                                    </div>
                                </CardContent>
                                <CardFooter className="flex gap-2">
                                    <Button
                                        className="flex-1"
                                        variant="outline"
                                        onClick={() => handleOpenDetails(goal)}
                                    >
                                        <List className="w-4 h-4 mr-2" />
                                        Details
                                    </Button>
                                    <Button
                                        className="flex-1"
                                        variant={isCompleted ? "secondary" : "default"}
                                        onClick={() => handleOpenContribute(goal)}
                                        disabled={isCompleted}
                                    >
                                        {isCompleted ? "Funded 🎉" : "Add Funds"}
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            )}

            <AddGoalModal
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                onSuccess={() => { fetchGoals(); fetchSummary(); }}
            />

            <AddLiquidFundModal
                isOpen={isAddFundsOpen}
                onClose={() => setIsAddFundsOpen(false)}
                onSuccess={() => { fetchGoals(); fetchSummary(); }}
                goal={selectedGoal}
            />

            <GoalDetailsModal
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                goal={selectedDetailsGoal}
            />
        </div>
    );
}