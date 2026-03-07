"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { KPICards } from "@/components/dashboard/KPICards";
import { CategoryExpenseChart } from "@/components/dashboard/CategoryExpenseChart";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { QuickAddFAB } from "@/components/transactions/QuickAddFAB";
import { AddTransactionModal } from "@/components/transactions/AddTransactionModal";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
    const [summary, setSummary] = useState<any>(null);
    const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [summaryRes, txRes] = await Promise.all([
                api.get("/transactions/summary"),
                api.get("/transactions?limit=5")
            ]);
            setSummary(summaryRes.data);
            setRecentTransactions(txRes.data.data);
        } catch (err) {
            console.error("Failed to fetch dashboard data", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Handle URL query for quick add
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('add') === 'true') {
                setIsAddOpen(true);
                // Clean up URL
                window.history.replaceState({}, '', '/');
            }
        }
    }, []);

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                    Your financial summary for the current month.
                </p>
            </div>

            <KPICards
                balance={summary?.balance || 0}
                income={summary?.income || 0}
                expense={summary?.expense || 0}
                investment={summary?.investment || 0}
                portfolioValue={summary?.portfolioValue || 0}
            />

            <div className="grid gap-4 lg:grid-cols-7">
                <RecentTransactions transactions={recentTransactions} />
                <CategoryExpenseChart data={summary?.categoryBreakdown || []} />
            </div>

            {/* Override QuickAddFAB to open modal instead of navigating */}
            <QuickAddFAB onClick={() => setIsAddOpen(true)} />

            <AddTransactionModal
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                onSuccess={fetchData}
            />
        </div>
    );
}
