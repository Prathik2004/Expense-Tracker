"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Loader2, IndianRupee, PieChart, ArrowUpRight, ArrowDownRight, Edit3, Eye, EyeOff, Plus, RefreshCw, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { UpdateValuationModal } from "@/components/dashboard/UpdateValuationModal";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { LogInvestedValuesForm } from "@/components/portfolio/LogInvestedValuesForm";

export default function PortfolioPage() {
    const [summary, setSummary] = useState<any>(null);
    const [investments, setInvestments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isValuationOpen, setIsValuationOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

    const [holdings, setHoldings] = useState<any[]>([]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [summaryRes, txRes] = await Promise.all([
                api.get("/portfolio"),
                api.get("/transactions?type=investment&limit=10")
            ]);
            setSummary(summaryRes.data);
            setHoldings(summaryRes.data.holdings || []);
            setInvestments(txRes.data.data);
        } catch (err) {
            console.error("Failed to fetch portfolio data", err);
        } finally {
            setIsLoading(false);
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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2,
            minimumFractionDigits: 2,
        }).format(amount);
    };

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const totalInvested = summary?.totalInvested || 0;
    const portfolioValue = summary?.portfolioValue || 0;
    const hasValuation = portfolioValue > 0;
    const totalHoldings = holdings.reduce((total, holding) => total + (holding.amount || 0), 0);

    let roi = 0;
    let absoluteGain = 0;

    if (hasValuation && totalInvested > 0) {
        roi = ((portfolioValue - totalInvested) / totalInvested) * 100;
        absoluteGain = portfolioValue - totalInvested;
    }

    return (
        <div className="space-y-6 pb-4">
            <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-700 via-purple-600 to-indigo-700 p-5 text-white shadow-lg sm:p-7">
                <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
                <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-medium text-purple-100">Your investment dashboard</p>
                        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Portfolio</h1>
                        <p className="mt-2 max-w-md text-sm text-purple-100">
                            See how your money is allocated and keep your current valuation up to date.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" className="bg-white/15 text-white hover:bg-white/25" onClick={() => setIsValuationOpen(true)}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Update value
                        </Button>
                        <Button variant="secondary" className="bg-white text-purple-700 hover:bg-purple-50" onClick={() => document.getElementById("portfolio-log-form")?.scrollIntoView({ behavior: "smooth", block: "center" })}>
                            <Plus className="mr-2 h-4 w-4" />
                            Log investment
                        </Button>
                    </div>
                </div>
            </section>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Card className="border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium tracking-tight">Total Invested</CardTitle>
                        <IndianRupee className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                            {isVisible ? formatCurrency(totalInvested) : '••••••'}
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            Principal amount invested
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-purple-200 bg-purple-50/60 shadow-sm dark:border-purple-900/50 dark:bg-purple-950/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium tracking-tight text-purple-700 dark:text-purple-400">Current Valuation</CardTitle>
                        <div className="flex items-center space-x-1">
                            <button
                                onClick={() => setIsVisible(!isVisible)}
                                className="p-1 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-md text-purple-600 dark:text-purple-400 transition-colors"
                                title={isVisible ? "Hide Valuation" : "Show Valuation"}
                            >
                                {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                            <button
                                onClick={() => setIsValuationOpen(true)}
                                className="p-1 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-md text-purple-600 dark:text-purple-400 transition-colors"
                                title="Update Valuation"
                            >
                                <Edit3 className="h-4 w-4" />
                            </button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-purple-700 dark:text-purple-400">
                            {hasValuation ? (isVisible ? formatCurrency(portfolioValue) : '••••••') : 'Not set'}
                        </div>
                        <p className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-1">
                            Based on manual updates
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm sm:col-span-2 lg:col-span-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium tracking-tight">Overall Return</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <div className={`text-3xl font-bold ${!isVisible ? 'text-zinc-900 dark:text-zinc-100' : hasValuation && roi >= 0 ? 'text-emerald-600 dark:text-emerald-500' : hasValuation && roi < 0 ? 'text-rose-600 dark:text-rose-500' : 'text-zinc-900 dark:text-zinc-100'}`}>
                                {isVisible ? (hasValuation ? `${roi >= 0 ? '+' : ''}${formatCurrency(absoluteGain)}` : '₹0') : '••••••'}
                            </div>
                        </div>
                        {hasValuation && (
                            <div className={`flex items-center mt-1 text-sm font-medium ${!isVisible ? 'text-zinc-500 dark:text-zinc-400' : roi >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'}`}>
                                {isVisible && (roi >= 0 ? <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-1" />)}
                                {isVisible ? `${Math.abs(roi).toFixed(2)}% ROI` : '•••% ROI'}
                            </div>
                        )}
                        {!hasValuation && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex items-center">
                                Set valuation to see returns
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid items-start gap-5 lg:grid-cols-5">
                {/* Left Column: Log Values & Breakdown */}
                <div className="space-y-5 lg:col-span-2">
                    <div id="portfolio-log-form">
                        <LogInvestedValuesForm onSuccess={fetchData} />
                    </div>

                    <Card className="border-0 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Allocation</CardTitle>
                            <CardDescription>Where your invested money is currently distributed</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {holdings.length === 0 ? (
                                    <div className="rounded-lg border border-dashed p-5 text-center">
                                        <PieChart className="mx-auto mb-2 h-7 w-7 text-zinc-300" />
                                        <p className="text-sm font-medium">No investments logged yet</p>
                                        <p className="mt-1 text-xs text-zinc-500">Use the form above to add your starting balances.</p>
                                    </div>
                                ) : (
                                    holdings.map((h, i) => (
                                        <div key={i} className="space-y-2">
                                            <div className="flex items-center justify-between gap-3 text-sm">
                                                <div className="flex min-w-0 items-center gap-2">
                                                    <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-purple-500" />
                                                    <span className="truncate font-medium">{h.category}</span>
                                                </div>
                                                <div className="flex shrink-0 items-center gap-2">
                                                    <span className="text-xs text-zinc-500">
                                                        {totalHoldings ? ((h.amount / totalHoldings) * 100).toFixed(1) : "0.0"}%
                                                    </span>
                                                    <span className="font-semibold">{formatCurrency(h.amount)}</span>
                                                </div>
                                            </div>
                                            <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                                                <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500" style={{ width: `${totalHoldings ? Math.min(100, (h.amount / totalHoldings) * 100) : 0}%` }} />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Transactions */}
                <div className="lg:col-span-3">
                    <Card className="border-0 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <div>
                                <CardTitle className="text-base">Recent investments</CardTitle>
                                <CardDescription className="mt-1">Your latest portfolio activity</CardDescription>
                            </div>
                            <span className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                                {investments.length} recent
                            </span>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <RecentTransactions transactions={investments} />
                        </CardContent>
                    </Card>
                </div>
            </div>

            <UpdateValuationModal
                isOpen={isValuationOpen}
                onClose={() => setIsValuationOpen(false)}
                onSuccess={fetchData}
                currentValuation={portfolioValue}
            />
        </div>
    );
}
