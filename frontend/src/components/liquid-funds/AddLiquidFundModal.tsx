"use client";

import { useState, useEffect } from "react";
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

interface GoalOption {
    _id: string;
    title: string;
    bucket: string;
    targetAmount: number;
}

interface AddLiquidFundProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    goal?: GoalOption | null;
}

export function AddLiquidFundModal({ isOpen, onClose, onSuccess, goal }: AddLiquidFundProps) {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [fundName, setFundName] = useState("");
    const [bucket, setBucket] = useState("");
    const [transactionType, setTransactionType] = useState<"INVEST" | "RETURN" | "WITHDRAW">("INVEST");
    const [amount, setAmount] = useState("");
    const [goalId, setGoalId] = useState<string | null>(goal?._id || null);
    const [notes, setNotes] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [goals, setGoals] = useState<GoalOption[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetchGoals();
            if (goal) {
                setBucket(goal.bucket);
                setGoalId(goal._id);
            }
        }
    }, [isOpen, goal]);

    const fetchGoals = async () => {
        try {
            const res = await api.get("/liquid-funds/goals-dropdown");
            setGoals(res.data);
            if (!goal && res.data.length > 0) {
                setBucket(res.data[0].bucket);
                setGoalId(res.data[0]._id);
            }
        } catch (err) {
            console.error("Failed to fetch goals", err);
        }
    };

    const handleGoalChange = (selectedGoalId: string | null) => {
        setGoalId(selectedGoalId);
        const selectedGoal = goals.find(g => g._id === selectedGoalId);
        if (selectedGoal) {
            setBucket(selectedGoal.bucket);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fundName || !bucket || !amount) {
            setError("Please fill all required fields");
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
            await api.post("/liquid-funds", {
                date,
                fundName,
                bucket,
                transactionType,
                amount: addAmount,
                goalId: goalId || undefined,
                notes: notes || undefined
            });
            onSuccess();
            onClose();
            // Reset form
            setDate(new Date().toISOString().split('T')[0]);
            setFundName("");
            setBucket("");
            setTransactionType("INVEST");
            setAmount("");
            setGoalId(null);
            setNotes("");
            fetchGoals();
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to add liquid fund transaction");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) {
                setDate(new Date().toISOString().split('T')[0]);
                setFundName("");
                setBucket("");
                setTransactionType("INVEST");
                setAmount("");
                setGoalId(null);
                setNotes("");
                setError("");
                onClose();
            }
        }}>
            <DialogContent className="sm:max-w-[500px] w-[95vw] p-4 sm:p-6 rounded-xl">
                <DialogHeader>
                    <DialogTitle>Add Liquid Fund Transaction</DialogTitle>
                    <DialogDescription>
                        Record an investment, return, or withdrawal
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 mt-2">
                    {error && <div className="text-sm font-medium text-destructive">{error}</div>}

                    <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input
                            id="date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="fundName">Fund Name</Label>
                        <Input
                            id="fundName"
                            placeholder="e.g. ICICI Prudential Liquid Fund"
                            value={fundName}
                            onChange={(e) => setFundName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bucket">Bucket / Category</Label>
                        <Input
                            id="bucket"
                            placeholder="e.g. INTERNATION TRIP"
                            value={bucket}
                            onChange={(e) => setBucket(e.target.value)}
                            required
                            disabled={!!goal}
                            className={goal ? "bg-zinc-100 dark:bg-zinc-800 cursor-not-allowed" : ""}
                        />
                        {goal && (
                            <p className="text-xs text-zinc-500">Bucket is auto-filled from the selected goal</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label className="text-zinc-500">Transaction Type</Label>
                        <Select value={transactionType} onValueChange={(val) => setTransactionType(val as "INVEST" | "RETURN" | "WITHDRAW")}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="INVEST">Invest</SelectItem>
                                <SelectItem value="RETURN">Return</SelectItem>
                                <SelectItem value="WITHDRAW">Withdraw</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount (₹)</Label>
                        <Input
                            id="amount"
                            type="number"
                            inputMode="decimal"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="text-2xl h-12 font-semibold px-4"
                            required
                            min="1"
                            step="0.01"
                        />
                    </div>

                    {!goal && (
                        <div className="space-y-2">
                            <Label htmlFor="goalId">Goal / Trip (Optional)</Label>
                            <Select value={goalId || ""} onValueChange={(val) => handleGoalChange(val)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select goal (optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">No Goal</SelectItem>
                                    {goals.map((g) => (
                                        <SelectItem key={g._id} value={g._id}>
                                            {g.title} ({g.bucket})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea
                            id="notes"
                            placeholder="Additional notes..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="resize-none"
                            rows={3}
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-12 text-base font-semibold"
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Add Transaction"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}