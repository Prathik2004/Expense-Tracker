"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import { AddLiquidFundModal } from "@/components/liquid-funds/AddLiquidFundModal";
import { AlertTriangle, ArrowUpRight, ChevronDown, Filter, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";

type LiquidFundTransaction = {
    _id: string;
    date: string;
    fundName: string;
    transactionType: "INVEST" | "RETURN" | "WITHDRAW";
    amount: number;
    goalId?: string | { _id: string; title?: string };
    goalName?: string;
    notes?: string;
};

export default function LiquidFundsPage() {
    const [transactions, setTransactions] = useState<LiquidFundTransaction[]>([]);
    const [summary, setSummary] = useState({
        totalInvested: 0,
        totalReturned: 0,
        totalWithdrawn: 0,
        netLiquidFunds: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<LiquidFundTransaction | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<LiquidFundTransaction | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [expandedTransactionId, setExpandedTransactionId] = useState<string | null>(null);
    const [filters, setFilters] = useState({
        fundName: "",
        goalId: "",
        transactionType: "",
        startDate: "",
        endDate: "",
    });
    const [filterOptions, setFilterOptions] = useState<{
        fundNames: string[];
        goals: { _id: string; title: string }[];
    }>({ fundNames: [], goals: [] });

    const fetchFilterOptions = useCallback(async () => {
        try {
            const res = await api.get("/liquid-funds/filter-options");
            setFilterOptions(res.data);
        } catch (err) {
            console.error("Failed to fetch liquid fund filter options", err);
        }
    }, []);

    const fetchTransactions = useCallback(async () => {
        try {
            setIsLoading(true);
            const query: Record<string, string | number> = { ...filters, page: 1, limit: 100 };
            Object.keys(query).forEach((key) => {
                if (!query[key]) delete query[key];
            });
            const res = await api.get("/liquid-funds", { params: query });
            setTransactions(res.data.data);
        } catch (err) {
            console.error("Failed to fetch liquid fund transactions", err);
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    const fetchSummary = useCallback(async () => {
        try {
            const res = await api.get("/liquid-funds/summary");
            setSummary(res.data);
        } catch (err) {
            console.error("Failed to fetch liquid fund summary", err);
        }
    }, []);

    useEffect(() => {
        fetchTransactions();
        fetchSummary();
        fetchFilterOptions();
    }, [fetchTransactions, fetchSummary, fetchFilterOptions]);

    const handleDelete = async (id: string) => {
        setIsDeleting(true);
        setDeleteError("");
        try {
            await api.delete(`/liquid-funds/${id}`);
            setDeleteTarget(null);
            fetchTransactions();
            fetchSummary();
        } catch (err) {
            console.error("Failed to delete transaction", err);
            setDeleteError("Couldn't delete this transaction. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    };

    const formatMoney = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

    const getGoalTitle = (tx: LiquidFundTransaction) => {
        if (typeof tx.goalId === "object" && tx.goalId?.title) return tx.goalId.title;
        return tx.goalName || filterOptions.goals.find((goal) => goal._id === tx.goalId)?.title || "General";
    };

    const groups = transactions.reduce((acc: Record<string, LiquidFundTransaction[]>, tx) => {
        const date = new Date(tx.date);
        const today = new Date();
        const isRecent = today.getTime() - date.getTime() < 30 * 24 * 60 * 60 * 1000;
        const label = isRecent
            ? date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()
            : "EARLIER";
        acc[label] = acc[label] || [];
        acc[label].push(tx);
        return acc;
    }, {});

    const investedPercent = summary.totalInvested
        ? Math.max(0, Math.min(100, (summary.netLiquidFunds / summary.totalInvested) * 100))
        : 0;

    return (
        <div className="mx-auto w-full max-w-5xl pb-24 md:pb-8">
            <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-[28px] font-bold leading-tight tracking-tight">Liquid Funds</h1>
                    <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">Investments and transactions</p>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        setEditingTransaction(null);
                        setIsAddOpen(true);
                    }}
                    className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
                >
                    <Plus className="h-4 w-4" />
                    Add
                </button>
            </div>

            <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70">
                <p className="text-[13px] text-zinc-500 dark:text-zinc-400">Current balance</p>
                <p className="mt-1 text-[36px] font-bold leading-tight tracking-tight">
                    {formatMoney(summary.netLiquidFunds)}
                </p>
                <div className="my-4 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${investedPercent}%` }} />
                </div>
                <div className="grid grid-cols-3">
                    <div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Invested</p>
                        <p className="mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                            {formatMoney(summary.totalInvested)}
                        </p>
                    </div>
                    <div className="border-l border-zinc-200 pl-4 dark:border-zinc-800">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Returned</p>
                        <p className="mt-1 text-sm font-semibold text-blue-600 dark:text-blue-400">
                            {formatMoney(summary.totalReturned)}
                        </p>
                    </div>
                    <div className="border-l border-zinc-200 pl-4 dark:border-zinc-800">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Withdrawn</p>
                        <p className="mt-1 text-sm font-semibold text-rose-600 dark:text-rose-400">
                            {formatMoney(summary.totalWithdrawn)}
                        </p>
                    </div>
                </div>
            </section>

            <div className="mt-5 flex w-full items-center gap-1.5 pb-1">
                {([
                    ["", "All"],
                    ["INVEST", "Invest"],
                    ["RETURN", "Return"],
                    ["WITHDRAW", "Withdraw"],
                ] as [string, string][]).map(([value, label]) => (
                    <button
                        key={value}
                        type="button"
                        title={label}
                        onClick={() => setFilters((prev) => ({ ...prev, transactionType: value }))}
                        className={`h-8 shrink-0 overflow-hidden whitespace-nowrap rounded-full px-2.5 text-xs font-medium transition ${
                            filters.transactionType === value
                                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950"
                                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                        }`}
                    >
                        {label}
                    </button>
                ))}
                <button
                    type="button"
                    aria-label="Filters"
                    onClick={() => setIsFilterOpen(true)}
                    className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                >
                    <Filter className="h-4 w-4" />
                </button>
            </div>

            {isLoading ? (
                <div className="flex h-48 items-center justify-center">
                    <Loader2 className="h-7 w-7 animate-spin text-zinc-400" />
                </div>
            ) : transactions.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-dashed border-zinc-300 px-5 py-12 text-center dark:border-zinc-700">
                    <p className="font-semibold">No transactions yet</p>
                    <button type="button" onClick={() => setIsAddOpen(true)} className="mt-2 text-sm text-zinc-500">
                        Add your first transaction
                    </button>
                </div>
            ) : (
                <div className="mt-2">
                    {Object.entries(groups).map(([label, items]) => (
                        <section key={label}>
                            <h2 className="py-3 text-[11px] font-bold tracking-[0.08em] text-zinc-500 dark:text-zinc-400">
                                {label}
                            </h2>
                            <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70">
                                {items.map((tx, index) => {
                                    const isWithdraw = tx.transactionType === "WITHDRAW";
                                    const isReturn = tx.transactionType === "RETURN";
                                    const sign = isWithdraw ? "−" : "+";
                                    const amountColor = isWithdraw
                                        ? "text-zinc-900 dark:text-zinc-100"
                                        : isReturn
                                            ? "text-blue-600 dark:text-blue-400"
                                            : "text-emerald-600 dark:text-emerald-400";
                                    const isExpanded = expandedTransactionId === tx._id;
                                    return (
                                        <div key={tx._id} className={index ? "border-t border-zinc-200 dark:border-zinc-800" : ""}>
                                            <button
                                                type="button"
                                                aria-expanded={isExpanded}
                                                onClick={() => setExpandedTransactionId(isExpanded ? null : tx._id)}
                                                className="flex min-h-[64px] w-full items-center gap-3 px-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                                            >
                                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                                                    isWithdraw
                                                        ? "bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400"
                                                        : isReturn
                                                            ? "bg-blue-50 text-blue-500 dark:bg-blue-950/40 dark:text-blue-400"
                                                            : "bg-emerald-50 text-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-400"
                                                }`}>
                                                    {isWithdraw ? (
                                                        <ArrowUpRight className="h-[18px] w-[18px] rotate-90" />
                                                    ) : (
                                                        <ArrowUpRight className="h-[18px] w-[18px] -rotate-90" />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-[15px] font-semibold">
                                                        {tx.notes || (tx.transactionType === "WITHDRAW"
                                                            ? "Withdrawal"
                                                            : tx.transactionType === "INVEST"
                                                                ? "Initial investment"
                                                                : "Return")}
                                                    </p>
                                                    <p className="mt-1 flex min-w-0 items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                                                        <span className="block max-w-[120px] truncate sm:max-w-[160px]" title={tx.fundName}>
                                                            {tx.fundName}
                                                        </span>
                                                        <span aria-hidden="true">·</span>
                                                        <span className="truncate">{getGoalTitle(tx)}</span>
                                                    </p>
                                                </div>
                                                <p className={`shrink-0 text-[15px] font-semibold ${amountColor}`}>
                                                    {sign}{formatMoney(tx.amount)}
                                                </p>
                                            </button>
                                            {isExpanded && (
                                                <div className="grid grid-cols-2 gap-2 px-3 pb-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingTransaction(tx);
                                                            setIsAddOpen(true);
                                                            setExpandedTransactionId(null);
                                                        }}
                                                        className="flex h-10 items-center justify-center gap-2 rounded-xl bg-zinc-100 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        aria-label="Delete transaction"
                                                        title="Delete transaction"
                                                        onClick={() => {
                                                            setDeleteError("");
                                                            setDeleteTarget(tx);
                                                        }}
                                                        className="flex h-10 items-center justify-center gap-1 whitespace-nowrap rounded-xl bg-rose-950/30 text-sm font-semibold text-rose-400 transition-colors hover:bg-rose-950/50"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5 shrink-0" />
                                                        <span className="sm:hidden">Delete</span>
                                                        <span className="hidden sm:inline">Delete transaction</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    ))}
                </div>
            )}

            {isFilterOpen && (
                <div className="fixed inset-0 z-[70]">
                    <button
                        type="button"
                        aria-label="Close filters"
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setIsFilterOpen(false)}
                    />
                    <section className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-5 pb-8 shadow-2xl dark:bg-zinc-900 md:left-auto md:right-8 md:bottom-8 md:w-[360px] md:rounded-3xl">
                        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700 md:hidden" />
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-lg font-bold">Filters</h2>
                            <button type="button" aria-label="Close" onClick={() => setIsFilterOpen(false)} className="rounded-lg p-2 text-zinc-500">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <label className="block text-xs font-semibold text-zinc-500">
                                Fund
                                <span className="relative mt-2 block">
                                    <select
                                        value={filters.fundName}
                                        onChange={(e) => setFilters((prev) => ({ ...prev, fundName: e.target.value }))}
                                        className="h-11 w-full appearance-none rounded-xl border border-zinc-200 bg-white px-3 pr-10 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                                    >
                                        <option value="">All funds</option>
                                        {filterOptions.fundNames.map((name) => <option key={name} value={name}>{name}</option>)}
                                    </select>
                                    <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-[17px] top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                                </span>
                            </label>
                            <label className="block text-xs font-semibold text-zinc-500">
                                Goal
                                <span className="relative mt-2 block">
                                    <select
                                        value={filters.goalId}
                                        onChange={(e) => setFilters((prev) => ({ ...prev, goalId: e.target.value }))}
                                        className="h-11 w-full appearance-none rounded-xl border border-zinc-200 bg-white px-3 pr-10 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                                    >
                                        <option value="">All goals</option>
                                        {filterOptions.goals.map((goal) => <option key={goal._id} value={goal._id}>{goal.title}</option>)}
                                    </select>
                                    <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-[17px] top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                                </span>
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <label className="text-xs font-semibold text-zinc-500">
                                    Start date
                                    <input type="date" value={filters.startDate} onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))} className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-white pl-2 pr-2 text-sm dark:border-zinc-700 dark:bg-zinc-800" />
                                </label>
                                <label className="text-xs font-semibold text-zinc-500">
                                    End date
                                    <input type="date" value={filters.endDate} onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))} className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-white pl-2 pr-2 text-sm dark:border-zinc-700 dark:bg-zinc-800" />
                                </label>
                            </div>
                        </div>
                        <div className="mt-6 flex gap-3">
                            <button type="button" onClick={() => setFilters({ fundName: "", goalId: "", transactionType: "", startDate: "", endDate: "" })} className="h-11 flex-1 rounded-xl bg-zinc-100 text-sm font-semibold dark:bg-zinc-800">
                                Clear
                            </button>
                            <button type="button" onClick={() => setIsFilterOpen(false)} className="h-11 flex-1 rounded-xl bg-zinc-900 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-950">
                                Apply
                            </button>
                        </div>
                    </section>
                </div>
            )}

            {deleteTarget && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-4">
                    <section
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="delete-transaction-title"
                        aria-describedby="delete-transaction-description"
                        className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
                    >
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <h2 id="delete-transaction-title" className="text-base font-bold">Delete transaction?</h2>
                        <p id="delete-transaction-description" className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                            This will permanently delete {deleteTarget.notes || deleteTarget.fundName} ({formatMoney(deleteTarget.amount)}). This action can&apos;t be undone.
                        </p>
                        {deleteError && <p role="alert" className="mt-3 text-xs font-medium text-rose-600 dark:text-rose-400">{deleteError}</p>}
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => {
                                    setDeleteTarget(null);
                                    setDeleteError("");
                                }}
                                className="h-9 rounded-xl bg-zinc-100 px-3 text-xs font-semibold text-zinc-700 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => handleDelete(deleteTarget._id)}
                                className="h-9 rounded-xl bg-rose-600 px-3 text-xs font-semibold text-white disabled:opacity-50"
                            >
                                {isDeleting ? "Deleting…" : "Delete"}
                            </button>
                        </div>
                    </section>
                </div>
            )}

            <AddLiquidFundModal
                isOpen={isAddOpen}
                onClose={() => {
                    setIsAddOpen(false);
                    setEditingTransaction(null);
                }}
                onSuccess={() => {
                    fetchTransactions();
                    fetchSummary();
                }}
                transaction={editingTransaction}
            />
        </div>
    );
}
