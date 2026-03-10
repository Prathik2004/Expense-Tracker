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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface AddFundsProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    goal: {
        _id: string;
        name?: string;
        title?: string;
        currentAmount: number;
        targetAmount: number;
    } | null;
}

export function AddFundsModal({ isOpen, onClose, onSuccess, goal }: AddFundsProps) {
    const [amount, setAmount] = useState("");
    const [assetType, setAssetType] = useState("liquid");
    const [notes, setNotes] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    if (!goal) return null;

    const remaining = goal.targetAmount - goal.currentAmount;
    const goalName = goal.title || goal.name || "this goal";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount) {
            setError("Please enter an amount");
            return;
        }

        const addAmount = parseFloat(amount);
        if (addAmount <= 0) {
            setError("Amount must be greater than 0");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            await api.post(`/goals/${goal._id}/deposit`, {
                amount: addAmount,
                assetType: assetType,
                notes: notes
            });
            onSuccess();
            onClose();
            setAmount("");
            setAssetType("liquid");
            setNotes("");
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to add funds");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) {
                setAmount("");
                setAssetType("liquid");
                setNotes("");
                setError("");
                onClose();
            }
        }}>
            <DialogContent className="sm:max-w-[425px] w-[95vw] p-4 sm:p-6 rounded-xl">
                <DialogHeader>
                    <DialogTitle>Add Funds</DialogTitle>
                    <DialogDescription>
                        Contribute towards {goalName}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 mt-2">
                    {error && <div className="text-sm font-medium text-destructive">{error}</div>}

                    <div className="space-y-1 mb-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">Current Progress</span>
                            <span className="font-medium">₹{goal.currentAmount.toLocaleString('en-IN')} / ₹{goal.targetAmount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">Remaining to Goal</span>
                            <span className="text-amber-600 dark:text-amber-500 font-medium">₹{remaining.toLocaleString('en-IN')}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount" className="text-zinc-500">Amount to Add (₹)</Label>
                        <Input
                            id="amount"
                            type="number"
                            inputMode="decimal"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="text-3xl h-14 font-semibold px-4 placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
                            required
                            min="1"
                            max={remaining}
                            step="0.01"
                        />
                        <p className="text-xs text-zinc-500 flex justify-end mt-1">
                            <button
                                type="button"
                                className="text-primary hover:underline"
                                onClick={() => setAmount(remaining.toString())}
                            >
                                Fill remaining
                            </button>
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-zinc-500">Asset Type</Label>
                        <Select value={assetType} onValueChange={(val) => setAssetType(val || 'liquid')}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select asset type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="liquid">Liquid Funds / Cash</SelectItem>
                                <SelectItem value="gold">Gold</SelectItem>
                                <SelectItem value="silver">Silver</SelectItem>
                                <SelectItem value="mutual_funds">Mutual Funds</SelectItem>
                                <SelectItem value="stocks">Stocks</SelectItem>
                                <SelectItem value="fds">Fixed Deposits</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes" className="text-zinc-500">Notes (Optional)</Label>
                        <Textarea
                            id="notes"
                            placeholder="Bank account, platform used, memo..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="resize-none"
                            rows={3}
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-12 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Add Funds"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
