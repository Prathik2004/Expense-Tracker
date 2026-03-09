"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Loader2, Download, Search, Plus, Trash2, Edit2, Filter, ChevronDown, ChevronUp, FileText, X } from "lucide-react";
import { AddTransactionModal } from "@/components/transactions/AddTransactionModal";

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<any>(null);

    // Filters and pagination
    const [page, setPage] = useState(1);
    const [type, setType] = useState<string>("all");
    const [search, setSearch] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [minAmount, setMinAmount] = useState("");
    const [maxAmount, setMaxAmount] = useState("");
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

    const limit = 10;

    useEffect(() => {
        fetchTransactions();
    }, [page, type, startDate, endDate, minAmount, maxAmount, selectedCategories, search]);

    const fetchTransactions = async () => {
        setIsLoading(true);
        try {
            let url = `/transactions?page=${page}&limit=${limit}`;
            if (type !== "all") url += `&type=${type}`;
            if (startDate) url += `&startDate=${startDate}`;
            if (endDate) url += `&endDate=${endDate}`;
            if (minAmount) url += `&minAmount=${minAmount}`;
            if (maxAmount) url += `&maxAmount=${maxAmount}`;
            if (selectedCategories.length > 0) url += `&category=${selectedCategories.join(',')}`;
            if (search) url += `&search=${search}`;

            const res = await api.get(url);
            setTransactions(res.data.data);
            setTotal(res.data.total);
        } catch (err) {
            console.error("Failed to fetch transactions", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this transaction?")) return;
        try {
            await api.delete(`/transactions/${id}`);
            fetchTransactions();
        } catch (err) {
            console.error("Failed to delete transaction", err);
        }
    };

    const handleEdit = (tx: any) => {
        setEditingTransaction(tx);
        setIsModalOpen(true);
    };

    const getQueryParams = () => {
        let query = `?type=${type}`;
        if (startDate) query += `&startDate=${startDate}`;
        if (endDate) query += `&endDate=${endDate}`;
        if (minAmount) query += `&minAmount=${minAmount}`;
        if (maxAmount) query += `&maxAmount=${maxAmount}`;
        if (selectedCategories.length > 0) query += `&category=${selectedCategories.join(',')}`;
        if (search) query += `&search=${search}`;
        return query;
    };

    const handleExportCSV = async () => {
        try {
            const query = getQueryParams();
            const res = await api.get(`/transactions/export/csv${query}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'transactions.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Failed to export contents", err);
        }
    };

    const handleExportPDF = async () => {
        try {
            const query = getQueryParams();
            const res = await api.get(`/transactions/export/pdf${query}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'financial_report.pdf');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Failed to export PDF", err);
        }
    };

    const CATEGORIES_LIST = [
        "Food", "Transport", "Housing", "Utilities", "Entertainment", "Healthcare", "Shopping",
        "Salary", "Freelance", "Gift", "Refund",
        "Indian Stocks", "US Stocks", "Mutual Funds", "Gold", "Silver", "Bonds", "Crypto", "Other"
    ].sort();

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                        Manage and export your financial activity.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={handleExportCSV}>
                        <Download className="w-4 h-4 mr-1" />
                        CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportPDF}>
                        <FileText className="w-4 h-4 mr-1" />
                        PDF Report
                    </Button>
                    <Button size="sm" onClick={() => { setEditingTransaction(null); setIsModalOpen(true); }}>
                        <Plus className="w-4 h-4 mr-1" />
                        Add New
                    </Button>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                        <Input
                            placeholder="Search descriptions..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 h-10"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Select value={type} onValueChange={(v) => setType(v as string)}>
                            <SelectTrigger className="w-[140px] h-10">
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="income">Income</SelectItem>
                                <SelectItem value="expense">Expense</SelectItem>
                                <SelectItem value="investment">Investment</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            variant={isAdvancedOpen ? "secondary" : "outline"}
                            className="h-10 px-3"
                            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                        >
                            <Filter className="w-4 h-4 mr-2" />
                            Filters
                            {isAdvancedOpen ? <ChevronUp className="w-3 h-3 ml-2" /> : <ChevronDown className="w-3 h-3 ml-2" />}
                        </Button>
                    </div>
                </div>

                {isAdvancedOpen && (
                    <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="space-y-2">
                            <label className="text-[11px] font-medium uppercase text-zinc-400">Date Range</label>
                            <div className="flex gap-2">
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="h-9 text-xs"
                                />
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="h-9 text-xs"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-medium uppercase text-zinc-400">Amount Range (₹)</label>
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    placeholder="Min"
                                    value={minAmount}
                                    onChange={(e) => setMinAmount(e.target.value)}
                                    className="h-9 text-xs"
                                />
                                <Input
                                    type="number"
                                    placeholder="Max"
                                    value={maxAmount}
                                    onChange={(e) => setMaxAmount(e.target.value)}
                                    className="h-9 text-xs"
                                />
                            </div>
                        </div>
                        <div className="space-y-2 lg:col-span-2">
                            <label className="text-[11px] font-medium uppercase text-zinc-400">Categories</label>
                            <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
                                {CATEGORIES_LIST.map(cat => (
                                    <Badge
                                        key={cat}
                                        variant={selectedCategories.includes(cat) ? "default" : "outline"}
                                        className={`cursor-pointer h-6 text-[10px] px-2 ${selectedCategories.includes(cat) ? 'bg-primary' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                                        onClick={() => {
                                            if (selectedCategories.includes(cat)) {
                                                setSelectedCategories(selectedCategories.filter(c => c !== cat));
                                            } else {
                                                setSelectedCategories([...selectedCategories, cat]);
                                            }
                                        }}
                                    >
                                        {cat}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                        <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-2 pt-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-8"
                                onClick={() => {
                                    setStartDate("");
                                    setEndDate("");
                                    setMinAmount("");
                                    setMaxAmount("");
                                    setSelectedCategories([]);
                                    setSearch("");
                                    setType("all");
                                }}
                            >
                                <X className="w-3 h-3 mr-1" />
                                Clear All
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-950 shadow-sm">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                                <TableHead className="w-[120px]">Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                                    </TableCell>
                                </TableRow>
                            ) : transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-zinc-500">
                                        No transactions found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                transactions.filter(t => t.description?.toLowerCase().includes(search.toLowerCase())).map((tx) => (
                                    <TableRow key={tx._id} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 transition-colors">
                                        <TableCell className="font-medium text-xs sm:text-sm">
                                            {format(new Date(tx.date), 'MMM dd, yyyy')}
                                        </TableCell>
                                        <TableCell className="max-w-[150px] truncate">{tx.description || '-'}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-normal text-[11px] h-5">
                                                {tx.category}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="secondary"
                                                className={`text-[11px] h-5 ${tx.type === 'income' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                    tx.type === 'expense' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                                                        'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                                    }`}
                                            >
                                                {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className={`text-right font-semibold ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-500' : tx.type === 'expense' ? 'text-zinc-900 dark:text-zinc-100' : 'text-purple-600 dark:text-purple-500'}`}>
                                            {tx.type === 'expense' ? '-' : '+'}₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-500" onClick={() => handleEdit(tx)}>
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20" onClick={() => handleDelete(tx._id)}>
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                    <p className="text-sm text-zinc-500">
                        Showing page {page} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(Math.min(totalPages, page + 1))}
                            disabled={page === totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            <AddTransactionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchTransactions}
                transaction={editingTransaction}
            />
        </div>
    );
}
