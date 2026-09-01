"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
    Plus, Target, Loader2, Trophy, TrendingUp, Calendar, PiggyBank, List
} from "lucide-react";
import dynamic from 'next/dynamic';
import { differenceInDays } from "date-fns";

const PhysicsJar = dynamic(() => import('@/components/goals/PhysicsJar').then(mod => mod.PhysicsJar), { ssr: false });
const AddGoalModal = dynamic(() => import('@/components/goals/AddGoalModal').then(mod => mod.AddGoalModal), { ssr: false });
const EditGoalModal = dynamic(() => import('@/components/goals/EditGoalModal').then(mod => mod.EditGoalModal), { ssr: false });
const AddFundsModal = dynamic(() => import('@/components/goals/AddFundsModal').then(mod => mod.AddFundsModal), { ssr: false });
const GoalContributionsList = dynamic(() => import('@/components/goals/GoalContributionsList').then(mod => mod.GoalContributionsList), { ssr: false });

export default function GoalsPage() {
    const [goals, setGoals] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<any>(null);
    const [contributingGoal, setContributingGoal] = useState<any>(null);
    const [detailsGoal, setDetailsGoal] = useState<any>(null);
    const [animationTrigger, setAnimationTrigger] = useState<{ [id: string]: number }>({});

    useEffect(() => { fetchGoals(); }, []);

    const fetchGoals = async () => {
        try {
            const res = await api.get('/goals');
            setGoals(res.data);
        } catch (err) {
            console.error("Failed to fetch goals", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenContribute = (goal: any) => setContributingGoal(goal);
    const handleOpenEdit = (goal: any) => setEditingGoal(goal);
    const handleOpenDetails = (goal: any) => setDetailsGoal(goal);

    const handleFundsSuccess = (goalId: string) => {
        setAnimationTrigger(prev => ({ ...prev, [goalId]: (prev[goalId] || 0) + 1 }));
        fetchGoals();
    };

    const activeGoals = goals.filter(g => (g.currentAmount / g.targetAmount) * 100 < 100);
    const completedGoals = goals.filter(g => (g.currentAmount / g.targetAmount) * 100 >= 100);

    return (
        <div className="space-y-5 pb-20 animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">Savings Goals</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {activeGoals.length} active
                        {completedGoals.length > 0 && <span className="text-emerald-600 dark:text-emerald-400 font-medium"> · {completedGoals.length} completed</span>}
                    </p>
                </div>
                <Button
                    onClick={() => setIsAddOpen(true)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 rounded-lg text-sm font-medium border-0"
                >
                    <Plus className="w-4 h-4 mr-1.5" />
                    New Goal
                </Button>
            </div>

            {isLoading ? (
                <div className="flex h-40 items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
            ) : goals.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-14 text-center border border-dashed border-border rounded-xl bg-muted/20">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                        <Target className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">No goals yet</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                        Set a savings target — vacation, emergency fund, or anything big.
                    </p>
                    <Button onClick={() => setIsAddOpen(true)} variant="outline" className="mt-4 h-8 rounded-lg text-xs">
                        Create your first goal
                    </Button>
                </div>
            ) : (
                <>
                    {/* Active */}
                    {activeGoals.length > 0 && (
                        <div className="grid gap-3 md:grid-cols-2 stagger-children">
                            {activeGoals.map((goal) => {
                                const name = goal.title || goal.name;
                                const pct = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
                                const remaining = goal.targetAmount - goal.currentAmount;
                                const daysLeft = goal.targetDate
                                    ? differenceInDays(new Date(goal.targetDate), new Date())
                                    : null;

                                return (
                                    <Card key={goal._id} className="card-base">
                                        <CardContent className="pt-5 pb-4 px-5">
                                            <div className="flex items-start gap-4 mb-4">
                                                <PhysicsJar currentAmount={goal.currentAmount} targetAmount={goal.targetAmount} goalName={name} triggerAnimation={animationTrigger[goal._id] || 0} />
                                                <div className="flex-1 min-w-0 pt-1">
                                                    <h3 className="text-sm font-semibold text-foreground leading-tight truncate">{name}</h3>
                                                    <div className="mt-1 flex items-center gap-1.5">
                                                        <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{Math.round(pct)}%</span>
                                                        <span className="text-xs text-muted-foreground">funded</span>
                                                    </div>
                                                    {daysLeft !== null && (
                                                        <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                                                            <Calendar className="w-3 h-3" />
                                                            <span>{daysLeft > 0 ? `${daysLeft} days left` : 'Past due'}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <Progress value={pct} className="h-1.5 mb-3 [&>div]:bg-emerald-500" />

                                            <div className="flex justify-between items-baseline mb-4">
                                                <div>
                                                    <span className="text-lg font-bold text-foreground">₹{goal.currentAmount.toLocaleString('en-IN')}</span>
                                                    <span className="text-xs text-muted-foreground ml-1">saved</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs font-semibold text-foreground">₹{remaining.toLocaleString('en-IN')}</span>
                                                    <span className="text-xs text-muted-foreground"> to go · </span>
                                                    <span className="text-xs text-muted-foreground">of ₹{goal.targetAmount.toLocaleString('en-IN')}</span>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" className="flex-1 h-8 rounded-lg text-xs" onClick={() => handleOpenDetails(goal)}>
                                                    <List className="w-3.5 h-3.5 mr-1" />
                                                    History
                                                </Button>
                                                <Button variant="outline" size="sm" className="flex-1 h-8 rounded-lg text-xs" onClick={() => handleOpenEdit(goal)}>
                                                    Edit
                                                </Button>
                                                <Button size="sm" className="flex-1 h-8 rounded-lg text-xs bg-primary text-primary-foreground hover:bg-primary/90 border-0" onClick={() => handleOpenContribute(goal)}>
                                                    <PiggyBank className="w-3.5 h-3.5 mr-1" />
                                                    Add Funds
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}

                    {/* Completed */}
                    {completedGoals.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Completed</h2>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                                {completedGoals.map((goal) => {
                                    const name = goal.title || goal.name;
                                    return (
                                        <Card key={goal._id} className="card-base border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-950/20">
                                            <CardContent className="pt-4 pb-4 px-5 flex flex-row items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                                                    <Trophy className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-sm font-semibold text-foreground truncate">{name}</h3>
                                                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">₹{goal.currentAmount.toLocaleString('en-IN')} reached</p>
                                                </div>
                                                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-md">Done</span>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </>
            )}

            {isAddOpen && (
                <AddGoalModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onSuccess={fetchGoals} />
            )}
            {editingGoal && (
                <EditGoalModal isOpen={!!editingGoal} onClose={() => setEditingGoal(null)} onSuccess={fetchGoals} goal={editingGoal} />
            )}
            {contributingGoal && (
                <AddFundsModal isOpen={!!contributingGoal} onClose={() => setContributingGoal(null)} onSuccess={(id: string) => handleFundsSuccess(id)} goal={contributingGoal} />
            )}
            {detailsGoal && (
                <GoalContributionsList isOpen={!!detailsGoal} onClose={() => setDetailsGoal(null)} goal={detailsGoal} />
            )}
        </div>
    );
}