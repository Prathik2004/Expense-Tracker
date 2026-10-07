"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AddLiquidFundModal } from "@/components/liquid-funds/AddLiquidFundModal";
import { LiquidFundTransactionRow } from "@/components/liquid-funds/LiquidFundTransactionRow";
import { Loader2, Plus, Trash2, List, Filter, DollarSign, BarChart3 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export default function LiquidFundsPage() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [summary, setSummary] = useState({ totalInvested: 0, totalReturned: 0, totalWithdrawn: 0, netLiquidFunds: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [filters, setFilters] = useState({
        fundName: '',
        bucket: '',
        transactionType: '',
        startDate: '',
        endDate: ''
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchTransactions();
        fetchSummary();
    }, [filters, currentPage]);

    const fetchTransactions = async () => {
        try {
            setIsLoading(true);
            const query = {
                ...filters,
                page: currentPage,
                limit: 10
            } as any;
            // Remove empty filters
            Object.keys(query).forEach(key => {
                if (query[key] === '' || query[key] === null || query[key] === undefined) {
                    delete query[key];
                }
            });
            const res = await api.get("/liquid-funds", { params: query });
            setTransactions(res.data.data);
            setTotalPages(res.data.totalPages);
        } catch (err) {
            console.error("Failed to fetch liquid fund transactions", err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSummary = async () => {
        try {
            const res = await api.get("/liquid-funds/summary");
            setSummary(res.data);
        } catch (err) {
            console.error("Failed to fetch liquid fund summary", err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this transaction?")) return;
        try {
            await api.delete(`/liquid-funds/${id}`);
            fetchTransactions();
            fetchSummary();
        } catch (err) {
            console.error("Failed to delete transaction", err);
        }
    };

    const handleFilterChange = (field: string, value: string) => {
        setFilters(prev => ({ ...prev, [field]: value }));
        setCurrentPage(1); // Reset to first page when filtering
    };

    const handleDateChange = (field: string, date: string) => {
        setFilters(prev => ({ ...prev, [field]: date }));
        setCurrentPage(1); // Reset to first page when filtering
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Liquid Funds</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                        Track your liquid fund investments and transactions.
                    </p>
                </div>
                <Button onClick={() => setIsAddOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Transaction
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-500">Total Invested</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">₹{summary.totalInvested.toLocaleString('en-IN')}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-500">Total Returned</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-500">₹{summary.totalReturned.toLocaleString('en-IN')}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-500">Total Withdrawn</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600 dark:text-red-500">₹{summary.totalWithdrawn.toLocaleString('en-IN')}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-500">Net Liquid Funds</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${summary.netLiquidFunds >= 0 ? '+' : ''}₹{Math.abs(summary.netLiquidFunds).toLocaleString('en-IN')}</div>
                        <p className="text-xs text-zinc-500 mt-1">
                            {summary.netLiquidFunds >= 0 ? 'Positive Balance' : 'Negative Balance'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="mb-4">
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                        <Button variant="outline" size="icon" onClick={() => setIsAddOpen(true)}>
                            <Plus className="w-4 h-4" />
                        </Button>
                        <CardTitle className="text-lg font-semibold">Filter Transactions</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="fundName-filter">Fund Name</Label>
                        <Input
                            id="fundName-filter"
                            placeholder="Filter by fund name..."
                            value={filters.fundName}
                            onChange={(e) => handleFilterChange('fundName', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bucket-filter">Bucket</Label>
                        <Input
                            id="bucket-filter"
                            placeholder="Filter by bucket..."
                            value={filters.bucket}
                            onChange={(e) => handleFilterChange('bucket', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="transactionType-filter">Transaction Type</Label>
                        <Select value={filters.transactionType} onValueChange={(val) => handleFilterChange('transactionType', val ?? '')}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All Types</SelectItem>
                                <SelectItem value="INVEST">Invest</SelectItem>
                                <SelectItem value="RETURN">Return</SelectItem>
                                <SelectItem value="WITHDRAW">Withdraw</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="startDate-filter">Start Date</Label>
                        <Input
                            id="startDate-filter"
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => handleDateChange('startDate', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="endDate-filter">End Date</Label>
                        <Input
                            id="endDate-filter"
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => handleDateChange('endDate', e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {isLoading ? (
                <div className="flex h-40 items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : transactions.length === 0 ? (
                <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
                    <DollarSign className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-4" />
                    <h3 className="text-lg font-medium">No transactions yet</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1 mb-4">
                        Add your first liquid fund transaction to get started.
                    </p>
                    <Button onClick={() => setIsAddOpen(true)} variant="outline">
                        Add Transaction
                    </Button>
                </Card>
            ) : (
                <div className="space-y-4">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
                            <thead className="bg-zinc-50 dark:bg-zinc-900">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                        Fund
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                        Bucket
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                        Goal / Trip
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                        Notes
                                    </th>
                                    <th scope="col" className="relative px-6 py-3">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700 bg-white dark:bg-zinc-900">
                                {transactions.map((tx) => (
                                    <LiquidFundTransactionRow
                                        key={tx._id}
                                        transaction={tx}
                                        onDelete={() => handleDelete(tx._id)}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                        <p className="text-sm text-zinc-500">
                            Page {currentPage} of {totalPages}
                        </p>
                        <div className="flex space-x-2">
                            <Button
                                variant="outline"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(currentPage - 1)}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(currentPage + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <AddLiquidFundModal
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                onSuccess={() => {
                    fetchTransactions();
                    fetchSummary();
                }}
            />
        </div>
    );
}