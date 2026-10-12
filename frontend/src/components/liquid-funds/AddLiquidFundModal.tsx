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
    bucket?: string;
    targetAmount: number;
}

interface AddLiquidFundProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    goal?: GoalOption | null;
    transaction?: {
        _id: string;
        date: string;
        fundName: string;
        transactionType: "INVEST" | "RETURN" | "WITHDRAW";
        amount: number;
        goalId?: string | { _id: string };
        notes?: string;
    } | null;
}

export function AddLiquidFundModal({ isOpen, onClose, onSuccess, goal, transaction }: AddLiquidFundProps) {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [fundName, setFundName] = useState("");
    const [fundSelection, setFundSelection] = useState("");
    const [fundNames, setFundNames] = useState<string[]>([]);
    const [fundSearch, setFundSearch] = useState("");
    const [debouncedFundSearch, setDebouncedFundSearch] = useState("");
    const [isFundSearchOpen, setIsFundSearchOpen] = useState(false);
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
            fetchFundNames();
            if (transaction) {
                setDate(new Date(transaction.date).toISOString().split('T')[0]);
                setFundName(transaction.fundName);
                setFundSelection(transaction.fundName);
                setFundSearch(transaction.fundName);
                setTransactionType(transaction.transactionType);
                setAmount(String(transaction.amount));
                setGoalId(typeof transaction.goalId === "object" ? transaction.goalId._id : transaction.goalId || goal?._id || null);
                setNotes(transaction.notes || "");
            } else if (goal) {
                setGoalId(goal._id);
            }
        }
    }, [isOpen, goal, transaction]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setDebouncedFundSearch(fundSearch.trim());
        }, 300);

        return () => window.clearTimeout(timer);
    }, [fundSearch]);

    const fetchGoals = async () => {
        try {
            const res = await api.get("/liquid-funds/goals-dropdown");
            setGoals(res.data);
            if (!goal && res.data.length > 0) {
                setGoalId(res.data[0]._id);
            }
        } catch (err) {
            console.error("Failed to fetch goals", err);
        }
    };

    const fetchFundNames = async () => {
        try {
            const res = await api.get("/liquid-funds/filter-options");
            setFundNames(res.data.fundNames || []);
        } catch (err) {
            console.error("Failed to fetch fund names", err);
        }
    };

    const handleGoalChange = (selectedGoalId: string | null) => {
        setGoalId(selectedGoalId);
    };

    const handleFundChange = (value: string | null) => {
        if (!value) return;
        if (value === "__create_new__") {
            const newFundName = debouncedFundSearch.trim();
            setFundName(newFundName);
            setFundSelection(newFundName);
            setFundSearch(newFundName);
            setIsFundSearchOpen(false);
            return;
        }

        setFundSelection(value);
        setFundName(value);
        setFundSearch(value);
        setIsFundSearchOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fundName || !goalId || !amount) {
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
            const payload = {
                date,
                fundName,
                transactionType,
                amount: addAmount,
                goalId: goalId || undefined,
                notes: notes || undefined
            };
            if (transaction) await api.patch(`/liquid-funds/${transaction._id}`, payload);
            else await api.post("/liquid-funds", payload);
            onSuccess();
            onClose();
            // Reset form
            setDate(new Date().toISOString().split('T')[0]);
            setFundName("");
            setFundSelection("");
            setFundSearch("");
            setIsFundSearchOpen(false);
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

    const filteredFundNames = fundNames.filter((name) =>
        name.toLowerCase().includes(debouncedFundSearch.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) {
                setDate(new Date().toISOString().split('T')[0]);
                setFundName("");
                setFundSelection("");
                setFundSearch("");
                setIsFundSearchOpen(false);
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
                    <DialogTitle>{transaction ? "Edit Liquid Fund Transaction" : "Add Liquid Fund Transaction"}</DialogTitle>
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
                            placeholder="Search fund names..."
                            value={fundSearch}
                            onFocus={() => setIsFundSearchOpen(true)}
                            onChange={(e) => {
                                setFundSearch(e.target.value);
                                setFundSelection("");
                                setFundName("");
                                setIsFundSearchOpen(true);
                            }}
                            autoComplete="off"
                        />
                        {isFundSearchOpen && (
                            <div className="relative">
                                <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-md">
                                    {filteredFundNames.map((name) => (
                                        <button
                                            key={name}
                                            type="button"
                                            className="flex w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                                            onMouseDown={(event) => event.preventDefault()}
                                            onClick={() => handleFundChange(name)}
                                        >
                                            {name}
                                        </button>
                                    ))}
                                    {debouncedFundSearch && filteredFundNames.length === 0 && (
                                        <button
                                            type="button"
                                            className="flex w-full rounded-md px-3 py-2 text-left text-sm font-medium text-primary hover:bg-accent"
                                            onMouseDown={(event) => event.preventDefault()}
                                            onClick={() => handleFundChange("__create_new__")}
                                        >
                                            Create new fund “{debouncedFundSearch}”
                                        </button>
                                    )}
                                    {!debouncedFundSearch && filteredFundNames.length === 0 && (
                                        <p className="px-3 py-2 text-sm text-zinc-500">No funds available</p>
                                    )}
                                </div>
                            </div>
                        )}
                        {!fundSelection && <p className="text-xs text-zinc-500">Search and select an existing fund, or create the typed name.</p>}
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
                            <Label htmlFor="goalId">Goal</Label>
                            <Select value={goalId || ""} onValueChange={(val) => handleGoalChange(val)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a goal" />
                                </SelectTrigger>
                                <SelectContent>
                                    {goals.map((g) => (
                                        <SelectItem key={g._id} value={g._id}>{g.title}</SelectItem>
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
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : transaction ? "Save Changes" : "Add Transaction"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}