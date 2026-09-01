"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import dynamic from 'next/dynamic';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Search, Loader2, Edit2, Trash2, Download, SlidersHorizontal, X,
    ChevronLeft, ChevronRight, Copy, ArrowRightLeft
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const AddTransactionModal = dynamic(() => import("@/components/transactions/AddTransactionModal").then(mod => mod.AddTransactionModal), { ssr: false });

const CATEGORIES_LIST = [
    "Food", "Transport", "Housing", "Utilities", "Entertainment", "Healthcare", "Shopping",
    "Salary", "Main Income", "Side Income", "Freelance", "Rental Income", "Bonus", "Gift", "Refund",
    "SIP", "Mutual Funds", "Indian Stocks", "US Stocks", "Gold", "Silver", "Bonds", "Crypto", "Other"
];

const TYPE_FILTERS = [
    { value: 'all', label: 'All' },
    { value: 'income', label: 'Income' },
    { value: 'expense', label: 'Expense' },
    { value: 'investment', label: 'Investment' },
];

function TypeBadge({ type }: { type: string }) {
    if (type === 'income') return <Badge variant="outline" className="text-[11px] h-5 rounded-md font-medium border-income/40 text-income bg-income-soft">Income</Badge>;
    if (type === 'expense') return <Badge variant="outline" className="text-[11px] h-5 rounded-md font-medium border-expense/40 text-expense bg-expense-soft">Expense</Badge>;
    return <Badge variant="outline" className="text-[11px] h-5 rounded-md font-medium border-investment/40 text-investment bg-investment-soft">Investment</Badge>;
}

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingTx, setEditingTx] = useState<any>(null);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [type, setType] = useState("all");
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [minAmount, setMinAmount] = useState("");
    const [maxAmount, setMaxAmount] = useState("");
    const [notifications, setNotifications] = useState<any>(null);

    const searchRef = useRef(search);
    searchRef.current = search;

    const selectedCategoriesRef = useRef(selectedCategories);
    selectedCategoriesRef.current = selectedCategories;

    const limit = 10;

    const filters = { type, search: searchRef.current, startDate, endDate, minAmount, maxAmount, selectedCategories, page, limit };
    const hasActiveFilters = type !== 'all' || search || startDate || endDate || minAmount || maxAmount || selectedCategories.length > 0;

    const fetchTransactions = async (searchTerm?: string, currentPage?: number) => {
        setIsLoading(true);
        setIsFetching(true);
        try {
            const term = searchTerm ?? searchRef.current;
            const pg = currentPage ?? page;
            const params = new URLSearchParams({ page: String(pg), limit: String(limit) });
            if (term) params.set('search', term);
            if (type !== 'all') params.set('type', type);
            if (startDate) params.set('startDate', startDate);
            if (endDate) params.set('endDate', endDate);
            if (minAmount) params.set('minAmount', minAmount);
            if (maxAmount) params.set('maxAmount', maxAmount);
            if (selectedCategoriesRef.current.length > 0) params.set('categories', selectedCategoriesRef.current.join(','));

            const res = await api.get(`/transactions?${params.toString()}`);
            setTransactions(res.data.data || []);
            setTotal(res.data.total || 0);
        } catch (err) {
            console.error("Failed to fetch transactions", err);
            toast.error("Failed to load transactions");
        } finally {
            setIsLoading(false);
            setIsFetching(false);
        }
    };

    useEffect(() => { fetchTransactions(); }, [page, type, selectedCategories]);

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') { setPage(1); fetchTransactions(search, 1); }
    };

    const handleDelete = async (id: string) => {
        toast.warning("Delete this transaction?", {
            description: "This cannot be undone.",
            action: { label: "Delete", onClick: async () => {
                try {
                    await api.delete(`/transactions/${id}`);
                    toast.success("Transaction deleted");
                    fetchTransactions();
                } catch (err) {
                    toast.error("Failed to delete");
                }
            }},
            cancel: { label: "Cancel", onClick: () => {} },
            duration: 10000,
        });
    };

    const handleCopy = (tx: any) => {
        const { _id, createdAt, updatedAt, ...rest } = tx;
        setEditingTx({ ...rest, _id: undefined });
        setIsAddOpen(true);
        toast.info("Transaction copied — edit and save");
    };

    const handleEdit = (tx: any) => { setEditingTx(tx); setIsAddOpen(true); };

    const toggleCategory = (cat: string) => {
        setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
        setPage(1);
    };

    const clearFilters = () => {
        setType('all'); setSearch(''); setStartDate(''); setEndDate('');
        setMinAmount(''); setMaxAmount(''); setSelectedCategories([]);
        setPage(1);
    };

    const totalPages = Math.max(1, Math.ceil(total / limit));

    const visiblePages = totalPages <= 5
        ? Array.from({ length: totalPages }, (_, i) => i + 1)
        : [1, 2, '...', totalPages - 1, totalPages];

    const exportCSV = async () => {
        try {
            notifications?.update({ type: 'loading', message: 'Exporting CSV...' });
            const res = await api.get('/transactions?page=1&limit=10000', { responseType: 'blob' });
            const url = URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a'); a.href = url; a.download = 'transactions.csv'; a.click();
            URL.revokeObjectURL(url);
        } catch { toast.error("Export failed"); }
    };

    return (
        <div className="space-y-4 pb-20 animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">Transactions</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {total > 0 ? `${total} transaction${total !== 1 ? 's' : ''}` : 'No transactions yet'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-9 rounded-lg text-sm" onClick={exportCSV}>
                        <Download className="w-4 h-4 mr-1.5" />
                        Export
                    </Button>
                    <Button
                        onClick={() => { setEditingTx(null); setIsAddOpen(true); }}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 rounded-lg text-sm font-medium border-0"
                    >
                        <ArrowRightLeft className="w-4 h-4 mr-1.5" />
                        Add Transaction
                    </Button>
                </div>
            </div>

            {/* Type filter chips */}
            <div className="flex items-center gap-2">
                <div className="flex bg-muted rounded-lg p-1 gap-0.5">
                    {TYPE_FILTERS.map(f => (
                        <button
                            key={f.value}
                            onClick={() => { setType(f.value); setPage(1); }}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                type === f.value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 rounded-lg text-xs ${isAdvancedOpen ? 'text-primary bg-primary/5' : 'text-muted-foreground'}`}
                    onClick={() => setIsAdvancedOpen(v => !v)}
                >
                    <SlidersHorizontal className="w-3.5 h-3.5 mr-1" />
                    Filters {hasActiveFilters && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-primary inline-block" />}
                </Button>
                {hasActiveFilters && (
                    <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs text-muted-foreground" onClick={clearFilters}>
                        <X className="w-3.5 h-3.5 mr-1" />Clear
                    </Button>
                )}
            </div>

            {/* Advanced filter panel */}
            {isAdvancedOpen && (
                <Card className="card-base p-4">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">From date</label>
                            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-8 rounded-lg text-xs" />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">To date</label>
                            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-8 rounded-lg text-xs" />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Min amount (₹)</label>
                            <Input type="number" placeholder="0" value={minAmount} onChange={e => setMinAmount(e.target.value)} className="h-8 rounded-lg text-xs" />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Max amount (₹)</label>
                            <Input type="number" placeholder="Any" value={maxAmount} onChange={e => setMaxAmount(e.target.value)} className="h-8 rounded-lg text-xs" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <p className="text-xs text-muted-foreground mb-2">Categories</p>
                        <div className="flex flex-wrap gap-1.5">
                            {CATEGORIES_LIST.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => toggleCategory(cat)}
                                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                                        selectedCategories.includes(cat)
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                        <Button size="sm" className="h-8 rounded-lg text-xs bg-primary text-primary-foreground hover:bg-primary/90 border-0" onClick={() => { setPage(1); fetchTransactions(search, 1); }}>
                            Apply Filters
                        </Button>
                    </div>
                </Card>
            )}

            {/* Search */}
            <div className="flex gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by description or category..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        className="pl-9 h-9 rounded-lg bg-muted border-border text-sm"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="border border-border rounded-xl overflow-hidden bg-card relative">
                {isFetching && <div className="absolute inset-x-0 top-0 h-0.5 bg-muted z-10"><div className="shimmer h-full w-full" /></div>}

                {/* Mobile */}
                <div className="md:hidden divide-y divide-border">
                    {isLoading ? (
                        <div className="p-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></div>
                    ) : transactions.length === 0 ? (
                        <div className="p-10 text-center">
                            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3"><ArrowRightLeft className="w-4 h-4 text-muted-foreground" /></div>
                            <p className="text-sm text-muted-foreground">No transactions found</p>
                        </div>
                    ) : (
                        transactions.map(tx => (
                            <div key={tx._id} className="p-3.5">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <TypeBadge type={tx.type} />
                                        <span className="text-sm font-medium truncate">{tx.description || tx.category}</span>
                                    </div>
                                    <span className={`text-sm font-bold ml-2 shrink-0 ${
                                        tx.type === 'income' ? 'text-income' : tx.type === 'expense' ? 'text-expense' : 'text-investment'
                                    }`}>
                                        {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}₹{tx.amount?.toLocaleString('en-IN')}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">{tx.category} · {format(new Date(tx.date), 'MMM dd, yyyy')}</span>
                                    <div className="flex gap-1 opacity-60">
                                        <button onClick={() => handleEdit(tx)} className="p-1 rounded text-muted-foreground hover:text-foreground"><Edit2 className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => handleCopy(tx)} className="p-1 rounded text-muted-foreground hover:text-foreground"><Copy className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => handleDelete(tx._id)} className="p-1 rounded text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Desktop */}
                <div className="hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border">
                                <TableHead className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide w-[110px]">Date</TableHead>
                                <TableHead className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Description</TableHead>
                                <TableHead className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Category</TableHead>
                                <TableHead className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide w-[90px]">Type</TableHead>
                                <TableHead className="text-right text-[11px] font-medium text-muted-foreground uppercase tracking-wide w-[130px]">Amount</TableHead>
                                <TableHead className="w-[100px]" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={6} className="h-32 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                            ) : transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-40 text-center">
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"><ArrowRightLeft className="w-4 h-4" /></div>
                                            <p className="text-sm">No transactions found</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                transactions.map(tx => (
                                    <TableRow key={tx._id} className="group hover:bg-muted/20 transition-colors border-b border-border/50 last:border-0">
                                        <TableCell className="text-sm text-muted-foreground py-3">{format(new Date(tx.date), 'MMM dd, yyyy')}</TableCell>
                                        <TableCell className="text-sm font-medium text-foreground py-3 max-w-[180px] truncate">{tx.description || '—'}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground py-3">{tx.category}</TableCell>
                                        <TableCell className="py-3"><TypeBadge type={tx.type} /></TableCell>
                                        <TableCell className="text-right py-3">
                                            <span className={`text-sm font-bold ${
                                                tx.type === 'income' ? 'text-income' : tx.type === 'expense' ? 'text-expense' : 'text-investment'
                                            }`}>
                                                {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}₹{tx.amount?.toLocaleString('en-IN')}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => handleEdit(tx)}><Edit2 className="w-3.5 h-3.5" /></Button>
                                                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => handleCopy(tx)}><Copy className="w-3.5 h-3.5" /></Button>
                                                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted" onClick={() => handleDelete(tx._id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                        Showing <span className="font-medium">{(page - 1) * limit + 1}–{Math.min(page * limit, total)}</span> of <span className="font-medium">{total}</span>
                    </p>
                    <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" className="h-8 rounded-lg px-3" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                            <ChevronLeft className="w-4 h-4 mr-0.5" />Prev
                        </Button>
                        {visiblePages.map((p, i) =>
                            p === '...' ? (
                                <span key={`ellipsis-${i}`} className="text-xs text-muted-foreground px-1">…</span>
                            ) : (
                                <Button
                                    key={p}
                                    variant={page === p ? 'default' : 'outline'}
                                    size="sm"
                                    className={`h-8 w-8 rounded-lg p-0 text-xs ${page === p ? 'bg-primary text-primary-foreground border-0' : ''}`}
                                    onClick={() => setPage(p as number)}
                                >
                                    {p}
                                </Button>
                            )
                        )}
                        <Button variant="outline" size="sm" className="h-8 rounded-lg px-3" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                            Next<ChevronRight className="w-4 h-4 ml-0.5" />
                        </Button>
                    </div>
                </div>
            )}

            {isAddOpen && (
                <AddTransactionModal isOpen={isAddOpen} onClose={() => { setIsAddOpen(false); setEditingTx(null); }} onSuccess={() => { fetchTransactions(); setIsAddOpen(false); setEditingTx(null); }} transaction={editingTx} />
            )}
        </div>
    );
}