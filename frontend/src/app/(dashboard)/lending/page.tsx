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
import { format } from "date-fns";
import { Loader2, Search, Plus, Trash2, Edit2, HandCoins } from "lucide-react";
import { AddLendingModal } from "@/components/lending/AddLendingModal";

export default function LendingPage() {
    const [lendingRecords, setLendingRecords] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<any>(null);

    // Filters and pagination
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");

    const limit = 10;

    useEffect(() => {
        fetchLendingRecords();
    }, [page]);

    const fetchLendingRecords = async () => {
        setIsLoading(true);
        try {
            let url = `/lending?page=${page}&limit=${limit}`;
            if (search) url += `&personName=${search}`;

            const res = await api.get(url);
            setLendingRecords(res.data.data);
            setTotal(res.data.total);
        } catch (err) {
            console.error("Failed to fetch lending records", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this record? Any linked salary transaction will also be removed.")) return;
        try {
            await api.delete(`/lending/${id}`);
            fetchLendingRecords();
        } catch (err) {
            console.error("Failed to delete record", err);
        }
    };

    const handleEdit = (record: any) => {
        setEditingRecord(record);
        setIsModalOpen(true);
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Lending Tracker</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                        Keep track of money you've lent to friends or family.
                    </p>
                </div>

                <Button onClick={() => { setEditingRecord(null); setIsModalOpen(true); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Lending
                </Button>
            </div>

            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                    placeholder="Search by person name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchLendingRecords()}
                    className="pl-9"
                />
            </div>

            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-950 shadow-sm">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                                <TableHead className="w-[120px]">Date</TableHead>
                                <TableHead>Person</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Source</TableHead>
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
                            ) : lendingRecords.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center text-zinc-500">
                                        <div className="flex flex-col items-center justify-center space-y-2">
                                            <HandCoins className="w-12 h-12 text-zinc-300 mb-2" />
                                            <p>No lending records found.</p>
                                            <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(true)}>Add your first one</Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                lendingRecords.map((record) => (
                                    <TableRow key={record._id} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 transition-colors">
                                        <TableCell className="font-medium text-xs sm:text-sm text-zinc-500">
                                            {format(new Date(record.date), 'MMM dd, yyyy')}
                                        </TableCell>
                                        <TableCell className="font-semibold text-zinc-900 dark:text-zinc-100">
                                            {record.personName}
                                        </TableCell>
                                        <TableCell className="max-w-[150px] truncate text-zinc-600 dark:text-zinc-400">
                                            {record.reason}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={`text-[10px] font-normal h-5 ${record.source === 'salary' ? 'border-primary/30 text-primary bg-primary/5' : ''}`}
                                            >
                                                {record.source === 'salary' ? 'Salary A/C' : 'Other'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-lg">
                                            ₹{record.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-500" onClick={() => handleEdit(record)}>
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20" onClick={() => handleDelete(record._id)}>
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

            <AddLendingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchLendingRecords}
                lending={editingRecord}
            />
        </div>
    );
}
