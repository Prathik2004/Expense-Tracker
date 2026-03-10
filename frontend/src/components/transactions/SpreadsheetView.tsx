"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    createColumnHelper,
} from "@tanstack/react-table";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { format } from "date-fns";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Transaction {
    _id: string;
    date: string;
    description: string;
    category: string;
    amount: number;
    type: "income" | "expense" | "investment";
}

interface SpreadsheetViewProps {
    data: Transaction[];
    isLoading: boolean;
    onUpdate: () => void;
}

const CATEGORIES = [
    "Food", "Transport", "Housing", "Utilities", "Entertainment", "Healthcare", "Shopping",
    "Salary", "Freelance", "Gift", "Refund",
    "Indian Stocks", "US Stocks", "Mutual Funds", "Gold", "Silver", "Bonds", "Crypto", "Other"
].sort();

// Cell component for inline editing
const EditableCell = ({
    value: initialValue,
    row,
    column,
    table
}: any) => {
    const [value, setValue] = useState(initialValue);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncError, setSyncError] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const onBlur = async () => {
        if (value === initialValue) return;

        setIsSyncing(true);
        setSyncError(false);
        try {
            const field = column.id;
            await api.patch(`/transactions/${row.original._id}`, {
                [field]: field === 'amount' ? parseFloat(value) : value
            });
            table.options.meta?.updateData(row.index, column.id, value);
        } catch (err) {
            console.error("Sync failed", err);
            setSyncError(true);
            setValue(initialValue); // Revert on error
        } finally {
            setIsSyncing(false);
        }
    };

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    if (column.id === 'category') {
        return (
            <Select value={value} onValueChange={(v) => { setValue(v); initialValue !== v && onBlur(); }}>
                <SelectTrigger className="h-8 border-none bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:ring-0 px-2">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {CATEGORIES.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        );
    }

    return (
        <div className="relative group flex items-center">
            <input
                ref={inputRef}
                value={value}
                onChange={e => setValue(e.target.value)}
                onBlur={onBlur}
                className={cn(
                    "w-full h-8 px-2 bg-transparent border-none outline-none focus:bg-white dark:focus:bg-zinc-900 focus:ring-1 focus:ring-primary rounded-sm transition-all text-sm",
                    column.id === 'amount' && "text-right font-semibold",
                    syncError && "text-rose-500"
                )}
            />
            {isSyncing && (
                <Loader2 className="absolute right-2 w-3 h-3 animate-spin text-zinc-400" />
            )}
            {syncError && (
                <AlertCircle className="absolute right-2 w-3 h-3 text-rose-500" />
            )}
        </div>
    );
};

export function SpreadsheetView({ data, isLoading, onUpdate }: SpreadsheetViewProps) {
    const columnHelper = createColumnHelper<Transaction>();

    const columns = useMemo(() => [
        columnHelper.accessor("date", {
            header: "Date",
            cell: info => <span className="text-xs text-zinc-500 px-2">{format(new Date(info.getValue()), 'MMM dd, yyyy')}</span>,
            size: 120,
        }),
        columnHelper.accessor("description", {
            header: "Description",
            cell: EditableCell,
        }),
        columnHelper.accessor("category", {
            header: "Category",
            cell: EditableCell,
            size: 150,
        }),
        columnHelper.accessor("type", {
            header: "Type",
            cell: info => (
                <span className={cn(
                    "text-[10px] uppercase font-bold px-2",
                    info.getValue() === 'income' ? 'text-emerald-500' :
                        info.getValue() === 'expense' ? 'text-rose-500' : 'text-purple-500'
                )}>
                    {info.getValue()}
                </span>
            ),
            size: 100,
        }),
        columnHelper.accessor("amount", {
            header: "Amount (₹)",
            cell: EditableCell,
            size: 120,
        }),
    ], [columnHelper]);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        meta: {
            updateData: (rowIndex: number, columnId: string, value: any) => {
                onUpdate(); // Refresh the parent data
            },
        },
    });

    if (isLoading && data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-zinc-500">Initializing spreadsheet...</p>
            </div>
        );
    }

    return (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-950 shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                    <thead>
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id} className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                                {headerGroup.headers.map(header => (
                                    <th
                                        key={header.id}
                                        className="text-left py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-400 border-r border-zinc-200 dark:border-zinc-800 last:border-r-0"
                                        style={{ width: header.getSize() }}
                                    >
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.map(row => (
                            <tr key={row.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                                {row.getVisibleCells().map(cell => (
                                    <td
                                        key={cell.id}
                                        className="border-r border-zinc-100 dark:border-zinc-800 last:border-r-0 p-0"
                                    >
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {data.length === 0 && (
                <div className="py-12 text-center text-zinc-500 border-t border-zinc-100 dark:border-zinc-800">
                    No records found for the current filters.
                </div>
            )}
        </div>
    );
}
