"use client";

import { useState } from "react";
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

interface AddBudgetProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const EXPENSE_CATEGORIES = [
    "Food", "Transport", "Housing", "Utilities", "Entertainment", "Healthcare", "Shopping", "Other"
];

export function AddBudgetModal({ isOpen, onClose, onSuccess }: AddBudgetProps) {
    const [category, setCategory] = useState("");
    const [monthlyLimit, setMonthlyLimit] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!category || !monthlyLimit) {
            setError("Please fill all required fields");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
            await api.post("/budgets", {
                category,
                monthlyLimit: parseFloat(monthlyLimit),
                month: currentMonth
            });
            onSuccess();
            onClose();
            // Reset form
            setCategory("");
            setMonthlyLimit("");
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to set budget");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Set Monthly Budget</DialogTitle>
                    <DialogDescription>
                        Defin limits for specific expense categories.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <div className="text-sm font-medium text-destructive">{error}</div>}

                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select value={category} onValueChange={(v) => setCategory(v as string)} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                                {EXPENSE_CATEGORIES.map(c => (
                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="monthlyLimit">Monthly Limit (₹)</Label>
                        <Input
                            id="monthlyLimit"
                            type="number"
                            placeholder="0.00"
                            value={monthlyLimit}
                            onChange={(e) => setMonthlyLimit(e.target.value)}
                            required
                            min="1"
                            step="0.01"
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Set Budget
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
