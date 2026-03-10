"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Loader2, IndianRupee, PieChart, ArrowUpRight, ArrowDownRight, Edit3, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

    let roi = 0;
    let absoluteGain = 0;

    if (hasValuation && totalInvested > 0) {
        roi = ((portfolioValue - totalInvested) / totalInvested) * 100;
        absoluteGain = portfolioValue - totalInvested;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                        Track your investments and returns.
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium tracking-tight">Total Invested</CardTitle>
                        <IndianRupee className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                            {formatCurrency(totalInvested)}
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            Principal amount invested
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-purple-200 dark:border-purple-900/50 bg-gradient-to-br from-purple-50/50 to-white dark:from-purple-950/20 dark:to-zinc-950">
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

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium tracking-tight">Overall Return</CardTitle>
                        <PieChart className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <div className={`text-3xl font-bold ${hasValuation && roi >= 0 ? 'text-emerald-600 dark:text-emerald-500' : hasValuation && roi < 0 ? 'text-rose-600 dark:text-rose-500' : 'text-zinc-900 dark:text-zinc-100'}`}>
                                {hasValuation ? `${roi >= 0 ? '+' : ''}${formatCurrency(absoluteGain)}` : '₹0'}
                            </div>
                        </div>
                        {hasValuation && (
                            <div className={`flex items-center mt-1 text-sm font-medium ${roi >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'}`}>
                                {roi >= 0 ? <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-1" />}
                                {Math.abs(roi).toFixed(2)}% ROI
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

            <div className="grid gap-4 lg:grid-cols-3 items-start">
                {/* Left Column: Log Values & Breakdown */}
                <div className="lg:col-span-1 space-y-4">
                    <LogInvestedValuesForm onSuccess={fetchData} />

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium tracking-tight">Investment Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {holdings.length === 0 ? (
                                    <p className="text-sm text-zinc-500">No investments logged yet.</p>
                                ) : (
                                    holdings.map((h, i) => (
                                        <div key={i} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-purple-500" />
                                                <span className="text-sm font-medium">{h.category}</span>
                                            </div>
                                            <span className="text-sm font-medium">{formatCurrency(h.amount)}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Transactions */}
                <div className="lg:col-span-2">
                    <RecentTransactions transactions={investments} />
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
