"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface AddTxProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CATEGORIES = {
    expense: ["Food", "Transport", "Housing", "Utilities", "Entertainment", "Healthcare", "Shopping", "Other"],
    income: ["Salary", "Freelance", "Gift", "Refund", "Other"],
    investment: ["Indian Stocks", "US Stocks", "Mutual Funds", "Gold", "Silver", "Bonds", "Crypto", "Other"]
};

export function AddTransactionModal({ isOpen, onClose, onSuccess }: AddTxProps) {
    const [type, setType] = useState<"income" | "expense" | "investment">("expense");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !category || !date) {
            setError("Please fill all required fields");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            await api.post("/transactions", {
                type,
                amount: parseFloat(amount),
                category,
                description,
                date: new Date(date).toISOString()
            });
            onSuccess();
            onClose();
            // Reset form
            setAmount("");
            setCategory("");
            setDescription("");
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to add transaction");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] w-[95vw] p-4 sm:p-6 rounded-xl">
                <DialogHeader>
                    <DialogTitle>Add Transaction</DialogTitle>
                    <DialogDescription>
                        Log a new income or expense
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 mt-2">
                    {error && <div className="text-sm font-medium text-destructive">{error}</div>}

                    <div className="flex bg-zinc-100 dark:bg-zinc-900 rounded-lg p-1">
                        <button
                            type="button"
                            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${type === 'expense' ? 'bg-white shadow-sm dark:bg-zinc-800 text-rose-600 dark:text-rose-500' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'}`}
                            onClick={() => { setType('expense'); setCategory(''); }}
                        >
                            Expense
                        </button>
                        <button
                            type="button"
                            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${type === 'income' ? 'bg-white shadow-sm dark:bg-zinc-800 text-emerald-600 dark:text-emerald-500' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'}`}
                            onClick={() => { setType('income'); setCategory(''); }}
                        >
                            Income
                        </button>
                        <button
                            type="button"
                            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${type === 'investment' ? 'bg-white shadow-sm dark:bg-zinc-800 text-purple-600 dark:text-purple-500' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'}`}
                            onClick={() => { setType('investment'); setCategory(''); }}
                        >
                            Invest
                        </button>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount" className="text-zinc-500">Amount (₹)</Label>
                        <Input
                            id="amount"
                            type="number"
                            inputMode="decimal"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="text-3xl h-14 font-semibold px-4 placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
                            required
                            min="0"
                            step="0.01"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="category" className="text-zinc-500">Category</Label>
                            <Select value={category} onValueChange={(v) => setCategory(v as string)} required>
                                <SelectTrigger className="h-12">
                                    <SelectValue placeholder="Select one" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES[type].map(c => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="date" className="text-zinc-500">Date</Label>
                            <Input
                                id="date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="h-12"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-zinc-500">Description (Optional)</Label>
                        <Input
                            id="description"
                            placeholder="What was this for?"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="h-12"
                        />
                    </div>

                    <Button
                        type="submit"
                        className={`w-full h-12 text-base font-semibold ${type === 'expense' ? 'bg-rose-600 hover:bg-rose-700 text-white' : type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : `Save ${type === 'income' ? 'Income' : type === 'expense' ? 'Expense' : 'Investment'}`}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
