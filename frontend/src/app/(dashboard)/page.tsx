"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { KPICards } from "@/components/dashboard/KPICards";
import { CategoryExpenseChart } from "@/components/dashboard/CategoryExpenseChart";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { QuickAddFAB } from "@/components/transactions/QuickAddFAB";
import { AddTransactionModal } from "@/components/transactions/AddTransactionModal";
import { MagicInput } from "@/components/dashboard/MagicInput";
import { ScrubberTimeline } from "@/components/dashboard/ScrubberTimeline";
import { Loader2 } from "lucide-react";

const CATEGORIES_LIST = [
    "Food", "Transport", "Housing", "Utilities", "Entertainment", "Healthcare", "Shopping",
    "Salary", "Freelance", "Gift", "Refund",
    "Indian Stocks", "US Stocks", "Mutual Funds", "Gold", "Silver", "Bonds", "Crypto", "Other"
];

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

export default function DashboardPage() {
    const [annualSummaries, setAnnualSummaries] = useState<any[]>(Array(12).fill(null));
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth()); // 0-11
    const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<any>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const currentYear = new Date().getFullYear();
            const [annualRes, txRes] = await Promise.all([
                api.get(`/transactions/annual-summary?year=${currentYear}`),
                api.get("/transactions?limit=5")
            ]);
            setAnnualSummaries(annualRes.data);
            setRecentTransactions(txRes.data.data);
        } catch (err) {
            console.error("Failed to fetch dashboard data", err);
        } finally {
            setIsLoading(false);
        }
    };

    // [Unchanged handleEdit, handleMagicAdd, handleDelete, useEffects]
    const handleEdit = (tx: any) => {
        setEditingTransaction(tx);
        setIsAddOpen(true);
    };

    const handleMagicAdd = (data: any) => {
        setEditingTransaction({
            ...data,
            type: 'expense', // Default to expense for magic add, can be changed in modal
            date: new Date().toISOString()
        });
        setIsAddOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this transaction?")) return;
        try {
            await api.delete(`/transactions/${id}`);
            fetchData();
        } catch (err) {
            console.error("Failed to delete transaction", err);
        }
    };

    useEffect(() => {
        fetchData();

        const handleSync = () => {
            fetchData();
        };

        window.addEventListener('sync_transactions', handleSync);
        return () => {
            window.removeEventListener('sync_transactions', handleSync);
        };
    }, []);

    // Handle URL query for quick add
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('add') === 'true') {
                setEditingTransaction(null);
                setIsAddOpen(true);
                // Clean up URL
                window.history.replaceState({}, '', '/');
            }
        }
    }, []);

    const activeSummary = annualSummaries[selectedMonth] || null;

    if (isLoading && !activeSummary) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-24">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                    Your financial summary for <span className="font-semibold text-emerald-600 dark:text-emerald-400">{MONTH_NAMES[selectedMonth]}</span>.
                </p>
            </div>

            <MagicInput onMagicAdd={handleMagicAdd} categories={CATEGORIES_LIST} />

            {/* Persistent sticky scrubber at the top (under header) or floating bottom */}
            <div className="sticky top-0 z-20 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-xl pb-4 border-b border-zinc-200/50 dark:border-zinc-800/50 mt-4 mb-8">
                <ScrubberTimeline value={selectedMonth} onChange={setSelectedMonth} />
            </div>

            <KPICards
                balance={activeSummary?.balance || 0}
                income={activeSummary?.income || 0}
                expense={activeSummary?.expense || 0}
                investment={activeSummary?.investment || 0}
                portfolioValue={activeSummary?.portfolioValue || 0}
            />

            <div className="grid gap-4 lg:grid-cols-7">
                <RecentTransactions
                    transactions={recentTransactions}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
                <CategoryExpenseChart data={activeSummary?.categoryBreakdown || []} />
            </div>

            {/* Override QuickAddFAB to open modal instead of navigating */}
            <QuickAddFAB onClick={() => { setEditingTransaction(null); setIsAddOpen(true); }} />

            <AddTransactionModal
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                onSuccess={fetchData}
                transaction={editingTransaction}
            />
        </div>
    );
}
