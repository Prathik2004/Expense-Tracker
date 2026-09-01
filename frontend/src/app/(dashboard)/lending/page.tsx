"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import dynamic from "next/dynamic";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
    Plus, Search, Loader2, Edit2, Trash2, HandCoins, ChevronLeft, ChevronRight, Banknote
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const AddLendingModal = dynamic(() => import("@/components/lending/AddLendingModal").then(mod => mod.AddLendingModal), { ssr: false });

export default function LendingPage() {
    const [lendingRecords, setLendingRecords] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<any>(null);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");

    const searchRef = useRef(search);
    searchRef.current = search;

    const fetchRecords = async (searchTerm?: string, currentPage?: number) => {
        setIsLoading(true);
        try {
            const term = searchTerm ?? searchRef.current;
            const pg = currentPage ?? page;
            const res = await api.get(`/lending?page=${pg}&limit=10${term ? `&personName=${encodeURIComponent(term)}` : ''}`);
            setLendingRecords(res.data.data || []);
            setTotal(res.data.total || 0);
        } catch (err) {
            console.error("Failed to fetch lending records", err);
            toast.error("Failed to load records");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchRecords(); }, [page]);

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') { setPage(1); fetchRecords(search, 1); }
    };

    const handleDelete = async (id: string) => {
        toast.warning("Remove this record?", {
            description: "This cannot be undone.",
            action: {
                label: "Delete",
                onClick: async () => {
                    try {
                        await api.delete(`/lending/${id}`);
                        toast.success("Record deleted");
                        fetchRecords();
                    } catch (err) {
                        toast.error("Failed to delete");
                    }
                },
            },
            cancel: { label: "Cancel", onClick: () => {} },
            duration: 8000,
        });
    };

    const handleEdit = (record: any) => { setEditingRecord(record); setIsModalOpen(true); };

    const totalPages = Math.max(1, Math.ceil(total / 10));
    const totalLent = lendingRecords.reduce((sum, r) => sum + (r.amount || 0), 0);
    const fromSalary = lendingRecords.filter(r => r.source === 'salary').reduce((s, r) => s + (r.amount || 0), 0);
    const fromOther = lendingRecords.filter(r => r.source !== 'salary').reduce((s, r) => s + (r.amount || 0), 0);

    return (
        <div className="space-y-5 pb-20 animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">Lending</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Track money you've lent to others</p>
                </div>
                <Button
                    onClick={() => { setEditingRecord(null); setIsModalOpen(true); }}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 rounded-lg text-sm font-medium border-0"
                >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Add Record
                </Button>
            </div>

            {/* Summary */}
            {!isLoading && lendingRecords.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                    <Card className="card-base col-span-3 sm:col-span-1">
                        <CardContent className="pt-4 pb-4">
                            <div className="flex items-center gap-1.5 mb-1">
                                <Banknote className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Total Lent</span>
                            </div>
                            <p className="text-xl font-bold text-foreground">₹{totalLent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{total} record{total !== 1 ? 's' : ''}</p>
                        </CardContent>
                    </Card>
                    <Card className="card-base">
                        <CardContent className="pt-4 pb-4">
                            <p className="text-xs text-muted-foreground mb-1">From Salary A/C</p>
                            <p className="text-base font-bold text-foreground">₹{fromSalary.toLocaleString('en-IN')}</p>
                        </CardContent>
                    </Card>
                    <Card className="card-base">
                        <CardContent className="pt-4 pb-4">
                            <p className="text-xs text-muted-foreground mb-1">From Other</p>
                            <p className="text-base font-bold text-foreground">₹{fromOther.toLocaleString('en-IN')}</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Search */}
            <div className="flex gap-2">
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        className="pl-9 h-9 rounded-lg bg-muted border-border"
                    />
                </div>
                {search && (
                    <Button variant="outline" size="sm" className="h-9 rounded-lg" onClick={() => { setSearch(""); setPage(1); fetchRecords("", 1); }}>
                        Clear
                    </Button>
                )}
            </div>

            {/* Table */}
            <div className="border border-border rounded-xl overflow-hidden bg-card">
                {/* Mobile */}
                <div className="md:hidden divide-y divide-border">
                    {isLoading ? (
                        <div className="p-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></div>
                    ) : lendingRecords.length === 0 ? (
                        <div className="p-10 text-center">
                            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3"><HandCoins className="w-4 h-4 text-muted-foreground" /></div>
                            <p className="text-sm text-muted-foreground">No records</p>
                            <Button variant="link" size="sm" className="mt-2 text-primary h-auto p-0" onClick={() => setIsModalOpen(true)}>Add your first</Button>
                        </div>
                    ) : (
                        lendingRecords.map((record) => (
                            <div key={record._id} className="p-4 flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">
                                    {record.personName?.[0]?.toUpperCase() || '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium truncate">{record.personName}</span>
                                        <span className="text-sm font-bold text-foreground ml-2">₹{record.amount?.toLocaleString('en-IN')}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate mt-0.5">{record.reason || '—'}</p>
                                    <div className="flex items-center justify-between mt-1.5">
                                        <span className="text-[11px] text-muted-foreground">{format(new Date(record.date), 'MMM dd, yyyy')}</span>
                                        <div className="flex gap-1">
                                            <button onClick={() => handleEdit(record)} className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"><Edit2 className="w-3.5 h-3.5" /></button>
                                            <button onClick={() => handleDelete(record._id)} className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted"><Trash2 className="w-3.5 h-3.5" /></button>
                                        </div>
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
                                <TableHead className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide w-[120px]">Date</TableHead>
                                <TableHead className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Person</TableHead>
                                <TableHead className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Reason</TableHead>
                                <TableHead className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Source</TableHead>
                                <TableHead className="text-right text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Amount</TableHead>
                                <TableHead className="w-[80px]" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={6} className="h-32 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                            ) : lendingRecords.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-40 text-center">
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"><HandCoins className="w-4 h-4" /></div>
                                            <p className="text-sm">No records</p>
                                            <Button variant="link" size="sm" className="text-primary h-auto p-0" onClick={() => setIsModalOpen(true)}>Add your first</Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                lendingRecords.map((record) => (
                                    <TableRow key={record._id} className="group hover:bg-muted/30 transition-colors border-b border-border/50 last:border-0">
                                        <TableCell className="text-sm text-muted-foreground py-3">{format(new Date(record.date), 'MMM dd, yyyy')}</TableCell>
                                        <TableCell className="py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                                                    {record.personName?.[0]?.toUpperCase() || '?'}
                                                </div>
                                                <span className="text-sm font-medium">{record.personName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground py-3 max-w-[140px] truncate">{record.reason || '—'}</TableCell>
                                        <TableCell className="py-3">
                                            <Badge variant="outline" className={`text-[11px] h-5 rounded-md font-medium ${record.source === 'salary' ? 'border-primary/30 text-primary bg-primary/5' : 'border-border text-muted-foreground bg-muted/50'}`}>
                                                {record.source === 'salary' ? 'Salary A/C' : 'Other'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right py-3">
                                            <span className="text-sm font-bold text-foreground">₹{record.amount?.toLocaleString('en-IN')}</span>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => handleEdit(record)}>
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted" onClick={() => handleDelete(record._id)}>
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

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span></p>
                    <div className="flex gap-1.5">
                        <Button variant="outline" size="sm" className="h-8 rounded-lg px-3" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                            <ChevronLeft className="w-4 h-4 mr-0.5" />Prev
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 rounded-lg px-3" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                            Next<ChevronRight className="w-4 h-4 ml-0.5" />
                        </Button>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <AddLendingModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingRecord(null); }} onSuccess={() => { fetchRecords(); setIsModalOpen(false); setEditingRecord(null); }} lending={editingRecord} />
            )}
        </div>
    );
}