"use client";

import { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import dynamic from 'next/dynamic';
import { Loader2 } from "lucide-react";
import { useNotificationStore } from "@/store/notification.store";

import { KPICards } from "@/components/dashboard/KPICards";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { MagicInput } from "@/components/dashboard/MagicInput";
import {
    CategoryChartSkeleton,
    RecentTransactionsSkeleton
} from "@/components/dashboard/DashboardSkeletons";

const CategoryExpenseChart = dynamic(() => import("@/components/dashboard/CategoryExpenseChart").then(mod => mod.CategoryExpenseChart), {
    ssr: false,
    loading: () => <CategoryChartSkeleton />
});
const QuickAddFAB = dynamic(() => import("@/components/transactions/QuickAddFAB").then(mod => mod.QuickAddFAB), { ssr: false });
const AddTransactionModal = dynamic(() => import("@/components/transactions/AddTransactionModal").then(mod => mod.AddTransactionModal), { ssr: false });

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
    const currentMonth = new Date().getMonth();
    const [selectedRange, setSelectedRange] = useState<[number, number]>([currentMonth, currentMonth]); // default single month

    // We fetch a fallback of absolute newest transactions if they haven't scrubbed, 
    // but we can also build the list dynamically from the cached annual data.
    const [isLoading, setIsLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<any>(null);
    const [isNonCriticalHydrated, setIsNonCriticalHydrated] = useState(false);
    const notifications = useNotificationStore();

    useEffect(() => {
        // Stagger hydration of non-critical components to free up mobile CPU
        const timer = setTimeout(() => {
            setIsNonCriticalHydrated(true);
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const currentYear = new Date().getFullYear();
            // We just need the annual-summary now, as it contains all transactions heavily cached
            const response = await api.get(`/transactions/annual-summary?year=${currentYear}`);
            setAnnualSummaries(response.data);
        } catch (err) {
            console.error("Failed to fetch dashboard data", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (tx: any) => {
        setEditingTransaction(tx);
        setIsAddOpen(true);
    };

    const handleMagicAdd = (data: any) => {
        setEditingTransaction({
            ...data,
            type: 'expense',
            date: new Date().toISOString()
        });
        setIsAddOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this transaction?")) return;
        notifications.show({ type: 'loading', message: 'Deleting...' });
        try {
            await api.delete(`/transactions/${id}`);
            notifications.update({ type: 'success', message: 'Deleted!' });
            fetchData();
            setTimeout(() => notifications.hide(), 2000);
        } catch (err) {
            console.error("Failed to delete transaction", err);
            notifications.show({ type: 'error', message: 'Deletion Failed' });
        }
    };

    useEffect(() => {
        fetchData();

        const handleSync = () => fetchData();
        window.addEventListener('sync_transactions', handleSync);
        return () => window.removeEventListener('sync_transactions', handleSync);
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('add') === 'true') {
                setEditingTransaction(null);
                setIsAddOpen(true);
                window.history.replaceState({}, '', '/');
            }
        }
    }, []);

    // Memoized computation to mathematically merge data across the selected months
    const activeSummary = useMemo(() => {
        const [start, end] = selectedRange;
        const monthsSlice = annualSummaries.slice(start, end + 1).filter(Boolean);

        if (monthsSlice.length === 0) return null;
        if (monthsSlice.length === 1) return monthsSlice[0];

        // Complex reduction for 2+ months
        const merged = {
            income: 0,
            expense: 0,
            investment: 0,
            balance: 0,
            portfolioValue: monthsSlice[monthsSlice.length - 1].portfolioValue || 0, // PV is a point-in-time, take the latest
            categoryBreakdown: [] as any[],
            transactions: [] as any[]
        };

        const categoryMap = new Map<string, number>();

        monthsSlice.forEach(month => {
            merged.income += month.income || 0;
            merged.expense += month.expense || 0;
            merged.investment += month.investment || 0;
            merged.balance += month.balance || 0;

            // Merge transactions
            if (month.transactions) {
                merged.transactions.push(...month.transactions);
            }

            // Merge categories
            if (month.categoryBreakdown) {
                month.categoryBreakdown.forEach((cat: any) => {
                    categoryMap.set(cat._id, (categoryMap.get(cat._id) || 0) + cat.total);
                });
            }
        });

        // Convert map back to sorted array
        merged.categoryBreakdown = Array.from(categoryMap.entries())
            .map(([id, total]) => ({ _id: id, total }))
            .sort((a, b) => b.total - a.total);

        // Sort transactions purely by date descending
        merged.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return merged;
    }, [annualSummaries, selectedRange]);

    if (isLoading && !activeSummary) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    // Determine header string
    const [startMonth, endMonth] = selectedRange;
    const dateText = startMonth === endMonth
        ? MONTH_NAMES[startMonth]
        : `${MONTH_NAMES[startMonth]} – ${MONTH_NAMES[endMonth]}`;

    return (
        <div className="space-y-6 pb-24">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                    Your financial summary for <span className="font-semibold text-emerald-600 dark:text-emerald-400">{dateText}</span>.
                </p>
            </div>

            <MagicInput onMagicAdd={handleMagicAdd} categories={CATEGORIES_LIST} />

            <KPICards
                balance={activeSummary?.balance || 0}
                income={activeSummary?.income || 0}
                expense={activeSummary?.expense || 0}
                investment={activeSummary?.investment || 0}
                portfolioValue={activeSummary?.portfolioValue || 0}
            />

            {isNonCriticalHydrated ? (
                <div className="grid gap-4 lg:grid-cols-7">
                    <RecentTransactions
                        transactions={(activeSummary?.transactions || []).slice(0, 5)} // Show top 5 from range
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                    <CategoryExpenseChart data={activeSummary?.categoryBreakdown || []} />
                </div>
            ) : (
                <div className="grid gap-4 lg:grid-cols-7">
                    <RecentTransactionsSkeleton />
                    <CategoryChartSkeleton />
                </div>
            )}

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
