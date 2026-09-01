"use client";

import { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import dynamic from 'next/dynamic';
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useNotificationStore } from "@/store/notification.store";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";

import { KPICards } from "@/components/dashboard/KPICards";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { MagicInput } from "@/components/dashboard/MagicInput";
import {
    CategoryChartSkeleton,
    RecentTransactionsSkeleton,
    KPICardsSkeleton
} from "@/components/dashboard/DashboardSkeletons";

const CategoryExpenseChart = dynamic(() => import("@/components/dashboard/CategoryExpenseChart").then(mod => mod.CategoryExpenseChart), {
    ssr: false,
    loading: () => <CategoryChartSkeleton />
});
const QuickAddFAB = dynamic(() => import("@/components/transactions/QuickAddFAB").then(mod => mod.QuickAddFAB), { ssr: false });
const AddTransactionModal = dynamic(() => import("@/components/transactions/AddTransactionModal").then(mod => mod.AddTransactionModal), { ssr: false });

const CATEGORIES_LIST = [
    "Food", "Transport", "Housing", "Utilities", "Entertainment", "Healthcare", "Shopping",
    "Salary", "Main Income", "Side Income", "Freelance", "Rental Income", "Bonus", "Gift", "Refund",
    "SIP", "Mutual Funds", "Indian Stocks", "US Stocks", "Gold", "Silver", "Bonds", "Crypto", "Other"
];

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];
const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
}

export default function DashboardPage() {
    const user = useAuthStore((s) => s.user);
    const [annualSummaries, setAnnualSummaries] = useState<any[]>(Array(12).fill(null));
    const currentMonth = new Date().getMonth();
    const [selectedRange, setSelectedRange] = useState<[number, number]>([currentMonth, currentMonth]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<any>(null);
    const [isNonCriticalHydrated, setIsNonCriticalHydrated] = useState(false);
    const notifications = useNotificationStore();

    const firstName = (user as any)?.name?.split(' ')[0] || 'there';

    useEffect(() => {
        const timer = setTimeout(() => setIsNonCriticalHydrated(true), 800);
        return () => clearTimeout(timer);
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const currentYear = new Date().getFullYear();
            const response = await api.get(`/transactions/annual-summary?year=${currentYear}`);
            setAnnualSummaries(response.data);
        } catch (err) {
            console.error("Failed to fetch dashboard data", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (tx: any) => { setEditingTransaction(tx); setIsAddOpen(true); };

    const handleMagicAdd = (data: any) => {
        setEditingTransaction({ ...data, type: 'expense', date: new Date().toISOString() });
        setIsAddOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this transaction?")) return;
        notifications.show({ type: 'loading', message: 'Deleting...' });
        try {
            await api.delete(`/transactions/${id}`);
            notifications.update({ type: 'success', message: 'Deleted!' });
            fetchData();
            setTimeout(() => notifications.hide(), 2000);
        } catch (err) {
            console.error("Failed to delete", err);
            notifications.show({ type: 'error', message: 'Failed' });
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
            const p = new URLSearchParams(window.location.search);
            if (p.get('add') === 'true') {
                setEditingTransaction(null);
                setIsAddOpen(true);
                window.history.replaceState({}, '', '/');
            }
        }
    }, []);

    const activeSummary = useMemo(() => {
        const [start, end] = selectedRange;
        const monthsSlice = annualSummaries.slice(start, end + 1).filter(Boolean);
        if (monthsSlice.length === 0) return null;
        if (monthsSlice.length === 1) return monthsSlice[0];

        const merged = {
            income: 0, mainIncome: 0, sideIncome: 0, expense: 0, investment: 0, sip: 0, balance: 0,
            portfolioValue: monthsSlice[monthsSlice.length - 1].portfolioValue || 0,
            categoryBreakdown: [] as any[], transactions: [] as any[]
        };
        const categoryMap = new Map<string, number>();

        monthsSlice.forEach(month => {
            merged.income += month.income || 0;
            merged.mainIncome += month.mainIncome || 0;
            merged.sideIncome += month.sideIncome || 0;
            merged.expense += month.expense || 0;
            merged.investment += month.investment || 0;
            merged.sip += month.sip || 0;
            merged.balance += month.balance || 0;
            if (month.transactions) merged.transactions.push(...month.transactions);
            if (month.categoryBreakdown) {
                month.categoryBreakdown.forEach((cat: any) => {
                    categoryMap.set(cat._id, (categoryMap.get(cat._id) || 0) + cat.total);
                });
            }
        });

        merged.categoryBreakdown = Array.from(categoryMap.entries())
            .map(([id, total]) => ({ _id: id, total }))
            .sort((a, b) => b.total - a.total);
        merged.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return merged;
    }, [annualSummaries, selectedRange]);

    const [startMonth, endMonth] = selectedRange;
    const dateText = startMonth === endMonth ? MONTH_NAMES[startMonth] : `${MONTH_NAMES[startMonth]} – ${MONTH_NAMES[endMonth]}`;

    const handlePrevMonth = () => setSelectedRange(([s, e]) => [Math.max(0, s - 1), Math.max(0, e - 1)]);
    const handleNextMonth = () => setSelectedRange(([s, e]) => [Math.min(11, s + 1), Math.min(11, e + 1)]);

    return (
        <div className="space-y-5 pb-24 animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                    <p className="text-sm text-muted-foreground mb-0.5">{getGreeting()},</p>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">{firstName}.</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Your financial overview for <span className="font-medium text-foreground">{dateText}</span>.
                    </p>
                </div>

                {/* Month navigator */}
                <div className="flex items-center gap-1 bg-muted rounded-xl p-1 self-start border border-border">
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-card" onClick={handlePrevMonth} disabled={startMonth === 0}>
                        <ChevronLeft className="w-3.5 h-3.5" />
                    </Button>
                    <div className="flex items-center gap-1.5 px-2 min-w-[90px] justify-center">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs font-medium">
                            {startMonth === endMonth ? MONTH_SHORT[startMonth] : `${MONTH_SHORT[startMonth]}–${MONTH_SHORT[endMonth]}`}
                        </span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-card" onClick={handleNextMonth} disabled={endMonth >= currentMonth}>
                        <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>

            <MagicInput onMagicAdd={handleMagicAdd} categories={CATEGORIES_LIST} />

            {isLoading && !activeSummary ? (
                <KPICardsSkeleton />
            ) : (
                <KPICards
                    balance={activeSummary?.balance || 0}
                    income={activeSummary?.income || 0}
                    mainIncome={activeSummary?.mainIncome || 0}
                    sideIncome={activeSummary?.sideIncome || 0}
                    expense={activeSummary?.expense || 0}
                    investment={activeSummary?.investment || 0}
                    sip={activeSummary?.sip || 0}
                    portfolioValue={activeSummary?.portfolioValue || 0}
                />
            )}

            {isNonCriticalHydrated ? (
                <div className="grid gap-4 lg:grid-cols-7">
                    <RecentTransactions
                        transactions={(activeSummary?.transactions || []).slice(0, 5)}
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