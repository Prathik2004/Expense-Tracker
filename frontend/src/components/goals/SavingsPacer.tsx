"use client";

import { useMemo } from "react";
import {
    differenceInMonths,
    differenceInWeeks,
    parseISO,
    isBefore,
    startOfDay
} from "date-fns";
import { TrendingUp, Calendar, Zap, CheckCircle2, AlertCircle } from "lucide-react";

interface SavingsPacerProps {
    targetAmount: number;
    currentAmount: number;
    targetDate: string;
}

export function SavingsPacer({ targetAmount, currentAmount, targetDate }: SavingsPacerProps) {
    const pacerData = useMemo(() => {
        const today = startOfDay(new Date());
        const deadline = startOfDay(parseISO(targetDate));

        // Status checks
        const isAchieved = currentAmount >= targetAmount;
        const isMissed = isBefore(deadline, today) && !isAchieved;

        if (isAchieved || isMissed) {
            return { isAchieved, isMissed };
        }

        const amountLeft = targetAmount - currentAmount;

        // Calculate raw weeks and months
        // We use differenceInDays/7 etc for more precision if needed, but date-fns helpers are good.
        // For "real-world" weekly/monthly targets, rounding up the period count is often safer.

        const weeksRaw = Math.max(1, differenceInWeeks(deadline, today, { roundingMethod: 'ceil' }));
        const monthsRaw = Math.max(1, differenceInMonths(deadline, today));

        // Adjusting months: differenceInMonths is 0 if < 1 month. We want at least 1 if not passed.
        const monthsRemaining = monthsRaw <= 0 ? 1 : monthsRaw;
        const weeksRemaining = weeksRaw;

        const requiredPerWeek = amountLeft / weeksRemaining;
        const requiredPerMonth = amountLeft / monthsRemaining;

        return {
            isAchieved,
            isMissed,
            amountLeft,
            weeksRemaining,
            monthsRemaining,
            requiredPerWeek,
            requiredPerMonth
        };
    }, [targetAmount, currentAmount, targetDate]);

    if (pacerData.isAchieved) {
        return (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
                <div className="bg-emerald-500/20 p-2 rounded-full">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Goal Achieved!</h4>
                    <p className="text-xs text-emerald-600/80 dark:text-emerald-400/60">You've successfully reached your target.</p>
                </div>
            </div>
        );
    }

    if (pacerData.isMissed) {
        return (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-center gap-3">
                <div className="bg-rose-500/20 p-2 rounded-full">
                    <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-rose-700 dark:text-rose-400">Deadline Passed</h4>
                    <p className="text-xs text-rose-600/80 dark:text-rose-400/60">The target date for this goal has passed.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                {/* Weekly Target */}
                <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Zap className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1">Weekly Target</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold">₹{Math.ceil(pacerData.requiredPerWeek || 0).toLocaleString('en-IN')}</span>
                        <span className="text-[10px] text-zinc-500">/ week</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1">For {pacerData.weeksRemaining} more {pacerData.weeksRemaining === 1 ? 'week' : 'weeks'}</p>
                </div>

                {/* Monthly Target */}
                <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Calendar className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1">Monthly Target</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold">₹{Math.ceil(pacerData.requiredPerMonth || 0).toLocaleString('en-IN')}</span>
                        <span className="text-[10px] text-zinc-500">/ month</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1">For {pacerData.monthsRemaining} more {pacerData.monthsRemaining === 1 ? 'month' : 'months'}</p>
                </div>
            </div>

            <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 flex items-start gap-3">
                <div className="mt-0.5">
                    <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <div>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        To reach your goal of <span className="font-bold text-zinc-900 dark:text-zinc-100 italic">₹{targetAmount.toLocaleString('en-IN')}</span>,
                        you need to save <span className="font-bold text-primary italic">₹{pacerData.amountLeft?.toLocaleString('en-IN')}</span> more.
                        Adjusting your pace helps you stay on track!
                    </p>
                </div>
            </div>
        </div>
    );
}
