"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Loader2, IndianRupee, RefreshCcw, TrendingUp, Landmark, Globe, Gem, Coins, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { LogInvestedValuesForm } from "@/components/portfolio/LogInvestedValuesForm";
import { LogInvestmentForm } from "@/components/portfolio/LogInvestmentForm";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const TRACKED_ASSETS = [
    { key: "Indian Stocks", label: "Indian Stocks", icon: Landmark },
    { key: "US Stocks", label: "US Stocks", icon: Globe },
    { key: "Mutual Funds", label: "Mutual Funds", icon: TrendingUp },
    { key: "Liquid Fund", label: "Liquid Fund", icon: Wallet },
    { key: "Gold", label: "Gold", icon: Gem },
    { key: "Silver", label: "Silver", icon: Coins },
];

export default function PortfolioPage() {
    const [summary, setSummary] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const summaryRes = await api.get("/portfolio");
            setSummary(summaryRes.data);
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

        const handleManualSync = async () => {
            setIsSyncing(true);
            try {
                const response = await api.post('/portfolio/sync/manual');
                toast.success('Portfolio synced from Google Sheets', {
                    description: `Updated ${response.data?.holdings?.length || 0} tracked assets.`,
                });
                await fetchData();
            } catch (err: any) {
                toast.error('Sync failed', {
                    description: err.response?.data?.message || 'Could not read the OneDrive workbook.',
                });
            } finally {
                setIsSyncing(false);
            }
        };

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
    const currentValue = summary?.currentValue ?? summary?.portfolioValue ?? 0;
    const gainLoss = summary?.gainLoss || 0;
    const gainLossPercentage = summary?.gainLossPercentage || 0;
    const holdings = summary?.holdings || [];
    const investments = summary?.investments || [];
    const snapshots = [...(summary?.snapshots || [])].reverse().map((snapshot: any) => ({
        date: new Date(snapshot.capturedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        value: Number(snapshot.currentValue) || 0,
    }));
    const lastSync = summary?.lastSync;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                        Track your holdings from Google Sheets or update them manually.
                    </p>
                    {lastSync?.completedAt && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                            Last sync: {new Date(lastSync.completedAt).toLocaleString()} {lastSync.status === 'success' ? '• synced successfully' : `• ${lastSync.status}`}
                        </p>
                    )}
                </div>
                <Button onClick={handleManualSync} disabled={isSyncing} className="bg-purple-600 hover:bg-purple-700 text-white">
                    {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                    Sync from OneDrive
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium tracking-tight">Total Tracked Value</CardTitle>
                        <IndianRupee className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                            {formatCurrency(currentValue)}
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            Latest combined value across tracked assets
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Invested</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{formatCurrency(totalInvested)}</div>
                        <p className="mt-1 text-xs text-zinc-500">Capital contributed across tracked sources</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Overall Gain / Loss</CardTitle></CardHeader>
                    <CardContent>
                        <div className={`text-3xl font-bold ${gainLoss >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(gainLoss)}</div>
                        <p className="mt-1 text-xs text-zinc-500">{gainLossPercentage.toFixed(2)}% since tracking began</p>
                    </CardContent>
                </Card>

                {TRACKED_ASSETS.map((asset) => {
                    const holding = holdings.find((entry: any) => entry.category === asset.key);
                    const Icon = asset.icon;

                    return (
                        <Card key={asset.key} className="border-zinc-200/80 dark:border-zinc-800 bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-950 dark:to-zinc-900">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium tracking-tight">{asset.label}</CardTitle>
                                <Icon className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                                    {formatCurrency(holding?.amount || 0)}
                                </div>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                    {holding?.source === 'excel' ? 'Synced from workbook' : 'Manual snapshot'}
                                </p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {snapshots.length > 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Portfolio History</CardTitle>
                        <CardDescription>Recorded value snapshots from manual and connected sources.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={snapshots}>
                                <XAxis dataKey="date" tickLine={false} axisLine={false} />
                                <YAxis hide domain={['auto', 'auto']} />
                                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {investments.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Connected Holdings</CardTitle>
                        <CardDescription>Individual holdings imported from INDmoney. Values use the last successful sync.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b text-left text-xs uppercase text-zinc-500">
                                    <tr><th className="py-2">Holding</th><th>Quantity</th><th>Invested</th><th>Current value</th><th>Gain / loss</th></tr>
                                </thead>
                                <tbody>
                                    {investments.map((investment: any) => {
                                        const invested = Number(investment.convertedInvestedAmount ?? investment.investedAmount) || 0;
                                        const value = Number(investment.convertedCurrentValue ?? investment.currentValue) || 0;
                                        return <tr key={investment._id || investment.externalId} className="border-b last:border-0">
                                            <td className="py-3"><div className="font-medium">{investment.name}</div><div className="text-xs text-zinc-500">{investment.symbol || investment.isin || investment.assetType || 'Investment'}</div></td>
                                            <td>{investment.quantity ?? '-'}</td><td>{formatCurrency(invested)}</td><td>{formatCurrency(value)}</td>
                                            <td className={value - invested >= 0 ? 'text-emerald-600' : 'text-red-600'}>{formatCurrency(value - invested)}</td>
                                        </tr>;
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-4 lg:grid-cols-3 items-start">
                <div className="lg:col-span-1 space-y-4">
                    <LogInvestmentForm onSuccess={fetchData} />
                    <LogInvestedValuesForm onSuccess={fetchData} />
                </div>

                <div className="lg:col-span-2">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="text-lg">Sync Status</CardTitle>
                            <CardDescription>
                                Manual investment events are kept as a ledger. Portfolio value snapshots are separate and show where each value came from.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {lastSync ? (
                                <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
                                    <p><span className="font-medium text-zinc-900 dark:text-zinc-50">Status:</span> {lastSync.status}</p>
                                    <p><span className="font-medium text-zinc-900 dark:text-zinc-50">Trigger:</span> {lastSync.trigger}</p>
                                    <p><span className="font-medium text-zinc-900 dark:text-zinc-50">Message:</span> {lastSync.message || 'No additional details'}</p>
                                </div>
                            ) : (
                                <p className="text-sm text-zinc-500">No sync has been run yet.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
