"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "@/components/ui/sheet";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Loader2, Trash2, Calendar, Tag, Info, Wallet } from "lucide-react";
import { format } from "date-fns";

interface TransactionDrawerProps {
    transaction: any | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CATEGORIES: Record<string, string[]> = {
    expense: ["Food", "Transport", "Housing", "Utilities", "Entertainment", "Healthcare", "Shopping", "Other"],
    income: ["Salary", "Freelance", "Gift", "Refund", "Other"],
    investment: ["Indian Stocks", "US Stocks", "Mutual Funds", "Gold", "Silver", "Bonds", "Crypto", "Other"]
};

export function TransactionDrawer({ transaction, isOpen, onClose, onSuccess }: TransactionDrawerProps) {
    const [type, setType] = useState<"income" | "expense" | "investment">("expense");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (transaction) {
            setType(transaction.type);
            setAmount(transaction.amount.toString());
            setCategory(transaction.category);
            setDescription(transaction.description || "");
            setDate(new Date(transaction.date).toISOString().split('T')[0]);
            setError("");
        }
    }, [transaction]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!transaction) return;

        setIsLoading(true);
        setError("");

        try {
            await api.patch(`/transactions/${transaction._id}`, {
                type,
                amount: parseFloat(amount),
                category,
                description,
                date: new Date(date).toISOString()
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to update transaction");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!transaction || !confirm("Are you sure you want to delete this transaction?")) return;

        setIsDeleting(true);
        try {
            await api.delete(`/transactions/${transaction._id}`);
            onSuccess();
            onClose();
        } catch (err) {
            console.error("Failed to delete transaction", err);
            setError("Failed to delete transaction");
        } finally {
            setIsDeleting(false);
        }
    };

    if (!transaction) return null;

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="sm:max-w-md w-full overflow-y-auto">
                <SheetHeader className="space-y-1 mb-6">
                    <SheetTitle className="text-2xl font-bold">Transaction Details</SheetTitle>
                    <SheetDescription>
                        View or edit your transaction information.
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleUpdate} className="space-y-6">
                    {error && (
                        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <div className="flex bg-zinc-100 dark:bg-zinc-900 rounded-lg p-1">
                        {(['expense', 'income', 'investment'] as const).map((t) => (
                            <button
                                key={t}
                                type="button"
                                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${type === t
                                    ? 'bg-white shadow-sm dark:bg-zinc-800 text-primary'
                                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                                    }`}
                                onClick={() => { setType(t); setCategory(''); }}
                            >
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="drawer-amount" className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                                Amount (₹)
                            </Label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-zinc-400">₹</span>
                                <Input
                                    id="drawer-amount"
                                    type="number"
                                    step="0.01"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="pl-10 text-3xl h-16 font-bold bg-zinc-50 dark:bg-zinc-900/50 border-none focus-visible:ring-1 focus-visible:ring-primary"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                                    <Tag className="w-3 h-3" /> Category
                                </Label>
                                <Select value={category} onValueChange={(v) => v && setCategory(v)} required>
                                    <SelectTrigger className="h-12 bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800">
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIES[type].map(c => (
                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="drawer-date" className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                                    <Calendar className="w-3 h-3" /> Date
                                </Label>
                                <Input
                                    id="drawer-date"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="h-12 bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="drawer-description" className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                                <Info className="w-3 h-3" /> Description
                            </Label>
                            <Input
                                id="drawer-description"
                                placeholder="Add a note..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="h-12 bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800"
                            />
                        </div>
                    </div>

                    <div className="pt-6 space-y-3">
                        <Button
                            type="submit"
                            className="w-full h-12 text-base font-semibold"
                            disabled={isLoading || isDeleting}
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full h-12 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-zinc-200 dark:border-zinc-800"
                            onClick={handleDelete}
                            disabled={isLoading || isDeleting}
                        >
                            {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <span className="flex items-center gap-2">
                                    <Trash2 className="w-4 h-4" /> Delete Transaction
                                </span>
                            )}
                        </Button>
                    </div>
                </form>

                <div className="mt-12 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="bg-zinc-50 dark:bg-zinc-900/30 rounded-xl p-4 space-y-3">
                        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-primary" /> Audit Information
                        </h4>
                        <div className="grid grid-cols-2 gap-y-2 text-xs">
                            <span className="text-zinc-500">Transaction ID:</span>
                            <span className="text-zinc-900 dark:text-zinc-100 font-mono truncate">{transaction._id}</span>
                            <span className="text-zinc-500">Created:</span>
                            <span className="text-zinc-900 dark:text-zinc-100">
                                {format(new Date(transaction.createdAt || transaction.date), 'MMM dd, yyyy HH:mm')}
                            </span>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
