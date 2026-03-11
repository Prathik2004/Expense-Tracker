"use client";

import { useState, useEffect } from "react";
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
import { evaluateMath } from "@/lib/mathParser";
import { hapticLight, hapticSuccess } from "@/lib/haptic";
import { useNotificationStore } from "@/store/notification.store";


interface AddTxProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    transaction?: any; // Optional transaction for editing
}

const CATEGORIES: Record<string, string[]> = {
    expense: ["Food", "Transport", "Housing", "Utilities", "Entertainment", "Healthcare", "Shopping", "Other"],
    income: ["Salary", "Freelance", "Gift", "Refund", "Other"],
    investment: ["Indian Stocks", "US Stocks", "Mutual Funds", "Gold", "Silver", "Bonds", "Crypto", "Other"]
};

export function AddTransactionModal({ isOpen, onClose, onSuccess, transaction }: AddTxProps) {
    const isEdit = !!transaction?._id;

    const [type, setType] = useState<"income" | "expense" | "investment">(transaction?.type || "expense");
    const [amount, setAmount] = useState(transaction?.amount?.toString() || "");
    const [category, setCategory] = useState(transaction?.category || "");
    const [description, setDescription] = useState(transaction?.description || "");
    const [date, setDate] = useState(transaction?.date ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const notifications = useNotificationStore();

    // Custom category logic
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategory, setNewCategory] = useState("");
    const [predictedAmount, setPredictedAmount] = useState<number | null>(null);

    // Sync form state when transaction changes or modal opens
    useEffect(() => {
        if (isOpen) {
            setType(transaction?.type || "expense");
            setAmount(transaction?.amount?.toString() || "");
            setCategory(transaction?.category || "");
            setDescription(transaction?.description || "");
            setDate(transaction?.date ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
            setIsAddingCategory(false);
            setNewCategory("");
            setPredictedAmount(null);
        }
    }, [isOpen, transaction]);

    // Smart Fill Prediction Logic
    useEffect(() => {
        if (isEdit || !description || description.length < 2) {
            setPredictedAmount(null);
            return;
        }

        const timeoutId = setTimeout(async () => {
            try {
                const res = await api.get(`/transactions/predict?q=${description}`);
                const prediction = res.data;

                if (prediction && prediction.description) {
                    // Update type first if available/different, as it affects category list
                    if (prediction.type && prediction.type !== type) {
                        setType(prediction.type);
                    }

                    // If prediction description matches current partially, auto-complete
                    if (prediction.description.toLowerCase().startsWith(description.toLowerCase()) &&
                        prediction.description.toLowerCase() !== description.toLowerCase()) {

                        setDescription(prediction.description);
                        if (prediction.category) {
                            setCategory(prediction.category);
                        }
                        if (prediction.amount) {
                            setPredictedAmount(prediction.amount);
                        }
                    } else if (prediction.description.toLowerCase() === description.toLowerCase()) {
                        // Just update category and amount suggestion if it's already full
                        if (prediction.category) setCategory(prediction.category);
                        if (prediction.amount) setPredictedAmount(prediction.amount);
                    }
                }
            } catch (err) {
                console.error("Prediction failed", err);
            }
        }, 600);

        return () => clearTimeout(timeoutId);
    }, [description, isEdit, type]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const finalCategory = isAddingCategory ? newCategory : category;

        if (!amount || !finalCategory || !date) {
            setError("Please fill all required fields");
            return;
        }

        setIsLoading(true);
        setError("");
        notifications.show({ type: 'loading', message: isEdit ? 'Updating...' : 'Saving...' });

        try {
            const evaluatedAmount = evaluateMath(amount) || parseFloat(amount) || 0;
            const data = {
                type,
                amount: evaluatedAmount,
                category: finalCategory,
                description,
                date: new Date(date).toISOString()
            };

            if (isEdit) {
                await api.patch(`/transactions/${transaction._id}`, data);
            } else {
                await api.post("/transactions", data);
            }

            hapticSuccess();
            notifications.update({ type: 'success', message: isEdit ? 'Updated!' : 'Saved!' });
            onSuccess();
            onClose();

            if (!isEdit) {
                // Reset form only if adding new
                setAmount("");
                setCategory("");
                setDescription("");
            }

            setTimeout(() => notifications.hide(), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'add'} transaction`);
            notifications.show({ type: 'error', message: 'Failed to Save' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] w-[95vw] p-4 sm:p-6 rounded-xl">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? 'Modify the details of your transaction' : 'Log a new income or expense'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 mt-2">
                    {error && <div className="text-sm font-medium text-destructive">{error}</div>}

                    {!isEdit && (
                        <div className="flex bg-zinc-100 dark:bg-zinc-900 rounded-lg p-1">
                            <button
                                type="button"
                                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${type === 'expense' ? 'bg-white shadow-sm dark:bg-zinc-800 text-rose-600 dark:text-rose-500' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'}`}
                                onClick={() => { setType('expense'); setCategory(''); setIsAddingCategory(false); }}
                            >
                                Expense
                            </button>
                            <button
                                type="button"
                                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${type === 'income' ? 'bg-white shadow-sm dark:bg-zinc-800 text-emerald-600 dark:text-emerald-500' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'}`}
                                onClick={() => { setType('income'); setCategory(''); setIsAddingCategory(false); }}
                            >
                                Income
                            </button>
                            <button
                                type="button"
                                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${type === 'investment' ? 'bg-white shadow-sm dark:bg-zinc-800 text-purple-600 dark:text-purple-500' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'}`}
                                onClick={() => { setType('investment'); setCategory(''); setIsAddingCategory(false); }}
                            >
                                Invest
                            </button>
                        </div>
                    )}

                    <div className="space-y-2 group/amount">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="amount" className="text-zinc-500">Amount (₹)</Label>
                            <div className="flex flex-col items-end">
                                {predictedAmount && !amount && (
                                    <span className="text-[10px] text-zinc-400 animate-pulse">Suggested: ₹{predictedAmount}</span>
                                )}
                                {amount && (evaluateMath(amount) !== null && evaluateMath(amount) !== parseFloat(amount)) && (
                                    <span className="text-[10px] text-blue-500 font-medium tracking-tight">Result: ₹{evaluateMath(amount)?.toLocaleString('en-IN')}</span>
                                )}
                            </div>
                        </div>

                        {/* Math Accessory Bar (Visible on mobile keyboard lack of operators) */}
                        <div className="flex gap-2 pb-1 overflow-x-auto no-scrollbar">
                            {['+', '-', '*', '/'].map((op) => (
                                <Button
                                    key={op}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-10 flex-shrink-0 border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                    onClick={() => {
                                        hapticLight();
                                        setAmount((prev: string) => prev + op);
                                    }}
                                >
                                    {op === '*' ? '×' : op === '/' ? '÷' : op}
                                </Button>
                            ))}
                        </div>

                        <Input
                            id="amount"
                            type="text"
                            inputMode="decimal"
                            placeholder={predictedAmount ? predictedAmount.toString() : "0.00"}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            onBlur={() => {
                                const result = evaluateMath(amount);
                                if (result !== null) setAmount(result.toString());
                            }}
                            className="text-3xl h-14 font-semibold px-4 placeholder:text-zinc-300 dark:placeholder:text-zinc-700 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                            required
                            autoFocus={isEdit}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="category" className="text-zinc-500">Category</Label>
                            {isAddingCategory ? (
                                <div className="flex gap-1">
                                    <Input
                                        placeholder="New Category"
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value)}
                                        className="h-12"
                                        autoFocus
                                        disabled={isEdit}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-12 px-2"
                                        onClick={() => setIsAddingCategory(false)}
                                        disabled={isEdit}
                                    >
                                        ✕
                                    </Button>
                                </div>
                            ) : (
                                <Select value={category} onValueChange={(v) => {
                                    if (v === 'ADD_NEW') {
                                        setIsAddingCategory(true);
                                    } else {
                                        setCategory(v);
                                    }
                                }} required disabled={isEdit}>
                                    <SelectTrigger className="h-12 text-sm disabled:opacity-80">
                                        <SelectValue placeholder="Select one" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIES[type].map(c => (
                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                        ))}
                                        <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />
                                        <SelectItem value="ADD_NEW" className="text-primary font-medium">
                                            + Add New
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="date" className="text-zinc-500">Date</Label>
                            <Input
                                id="date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="h-12 text-sm disabled:opacity-80"
                                required
                                disabled={isEdit}
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
                            className="h-12 disabled:opacity-80"
                            disabled={isEdit}
                        />
                    </div>

                    <Button
                        type="submit"
                        className={`w-full h-12 text-base font-semibold ${type === 'expense' ? 'bg-rose-600 hover:bg-rose-700 text-white' : type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> :
                            isEdit ? `Update ${type === 'income' ? 'Income' : type === 'expense' ? 'Expense' : 'Investment'}` :
                                `Save ${type === 'income' ? 'Income' : type === 'expense' ? 'Expense' : 'Investment'}`
                        }
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
