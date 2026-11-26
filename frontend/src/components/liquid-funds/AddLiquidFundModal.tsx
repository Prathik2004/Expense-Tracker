"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, X } from "lucide-react";

interface GoalOption {
    _id: string;
    title: string;
    bucket?: string;
    targetAmount: number;
}

interface AddLiquidFundProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (transactionType?: "INVEST" | "RETURN" | "WITHDRAW") => void;
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
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [fundName, setFundName] = useState("");
    const [fundNames, setFundNames] = useState<string[]>([]);
    const [transactionType, setTransactionType] = useState<"INVEST" | "RETURN" | "WITHDRAW">("INVEST");
    const [amount, setAmount] = useState("");
    const [goalId, setGoalId] = useState("");
    const [goals, setGoals] = useState<GoalOption[]>([]);
    const [notes, setNotes] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showNewFund, setShowNewFund] = useState(false);

    const fetchGoals = useCallback(async () => {
        try {
            const res = await api.get("/liquid-funds/goals-dropdown");
            setGoals(res.data);
            if (!goal && !transaction && res.data.length > 0) {
                setGoalId(res.data[0]._id);
            }
        } catch (err) {
            console.error("Failed to fetch goals", err);
        }
    }, [goal, transaction]);

    const fetchFundNames = useCallback(async () => {
        try {
            const res = await api.get("/liquid-funds/filter-options");
            const names = res.data.fundNames || [];
            setFundNames(names);
            if (names.length > 0 && !transaction && !goal) setFundName(names[0]);
        } catch (err) {
            console.error("Failed to fetch fund names", err);
        }
    }, [goal, transaction]);

    useEffect(() => {
        if (!isOpen) return;
        if (transaction) {
            setDate(transaction.date?.slice(0, 10) || new Date().toISOString().split("T")[0]);
            setFundName(transaction.fundName);
            setTransactionType(transaction.transactionType);
            setAmount(String(transaction.amount));
            setNotes(transaction.notes || "");
            setGoalId(typeof transaction.goalId === "object" ? transaction.goalId._id : transaction.goalId || goal?._id || "");
        } else {
            setDate(new Date().toISOString().split("T")[0]);
            if (goal) setGoalId(goal._id);
        }
        fetchGoals();
        fetchFundNames();
    }, [isOpen, goal, transaction, fetchGoals, fetchFundNames]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const numericAmount = Number(amount);
        if (!fundName || !goalId || numericAmount <= 0) return;

        setIsLoading(true);
        try {
            const payload = {
                date,
                fundName,
                transactionType,
                amount: numericAmount,
                goalId,
                notes: notes || undefined,
            };
            if (transaction) {
                await api.patch(`/liquid-funds/${transaction._id}`, payload);
            } else {
                await api.post("/liquid-funds", payload);
            }
            onSuccess(transactionType);
            setAmount("");
            setNotes("");
            setTransactionType("INVEST");
            onClose();
        } catch (err) {
            console.error("Failed to add liquid fund transaction", err);
        } finally {
            setIsLoading(false);
        }
    };

    const resetAndClose = () => {
        setAmount("");
        setNotes("");
        setTransactionType("INVEST");
        setShowNewFund(false);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetAndClose(); }}>
            <DialogContent
                showCloseButton={false}
                className="bottom-0 left-0 top-auto max-h-[92vh] w-full max-w-none translate-x-0 translate-y-0 overflow-y-auto rounded-t-3xl border-0 p-5 pb-8 sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-w-[500px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl"
            >
                <DialogHeader>
                    <div className="mb-1 flex items-center justify-between">
                        <DialogTitle className="text-lg font-bold">New transaction</DialogTitle>
                        <button type="button" aria-label="Close" onClick={resetAndClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="mt-1 grid grid-cols-3 rounded-2xl bg-zinc-100 p-1 dark:bg-zinc-950">
                        {(["INVEST", "RETURN", "WITHDRAW"] as const).map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setTransactionType(type)}
                                className={`h-10 rounded-xl text-sm font-semibold transition ${
                                    transactionType === type
                                        ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-700 dark:text-white"
                                        : "text-zinc-500 dark:text-zinc-400"
                                }`}
                            >
                                {type === "INVEST" ? "Invest" : type === "RETURN" ? "Return" : "Withdraw"}
                            </button>
                        ))}
                    </div>

                    <div className="my-5 flex flex-col items-center">
                        <label htmlFor="liquid-amount" className="text-xs text-zinc-500">Amount</label>
                        <div className="flex items-center gap-2">
                            <span className="text-[32px] text-zinc-400">₹</span>
                            <input
                                id="liquid-amount"
                                inputMode="numeric"
                                type="number"
                                min="1"
                                step="0.01"
                                placeholder="0"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-40 bg-transparent text-center text-[32px] font-bold outline-none placeholder:text-zinc-300"
                            />
                        </div>
                    </div>

                    <p className="mb-2 text-[11px] font-bold tracking-[0.08em] text-zinc-500">FUND</p>
                    <div className="grid grid-cols-2 gap-2">
                        {fundNames.slice(0, 6).map((name) => (
                            <button
                                key={name}
                                type="button"
                                title={name}
                                onClick={() => { setFundName(name); setShowNewFund(false); }}
                                className={`h-9 min-w-0 w-full rounded-full px-3 text-left text-sm font-medium ${
                                    fundName === name && !showNewFund
                                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950"
                                        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                                }`}
                            >
                                <span className="block truncate">{name}</span>
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => setShowNewFund(true)}
                            className={`h-9 w-full rounded-full px-3 text-left text-sm font-medium ${showNewFund ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"}`}
                        >
                            + New
                        </button>
                    </div>
                    {showNewFund && (
                        <input
                            autoFocus
                            placeholder="Fund name"
                            value={fundName}
                            onChange={(e) => setFundName(e.target.value)}
                            className="mt-3 h-11 w-full rounded-xl border border-zinc-200 bg-transparent px-3 text-sm outline-none dark:border-zinc-700"
                        />
                    )}

                    <p className="mb-2 mt-5 text-[11px] font-bold tracking-[0.08em] text-zinc-500">GOAL</p>
                    <div className="grid grid-cols-2 gap-2">
                        {goals.map((goal) => (
                            <button
                                key={goal._id}
                                type="button"
                                title={goal.title}
                                onClick={() => setGoalId(goal._id)}
                                className={`h-9 w-full min-w-0 rounded-full px-3 text-left text-sm font-medium ${
                                    goalId === goal._id
                                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950"
                                        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                                }`}
                            >
                                <span className="block truncate">{goal.title}</span>
                            </button>
                        ))}
                        {goals.length === 0 && (
                            <button type="button" className="h-9 rounded-full bg-zinc-100 px-4 text-sm font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                                General
                            </button>
                        )}
                    </div>

                    <div className="mt-5 grid grid-cols-[1fr_auto] gap-2">
                        <input
                            type="date"
                            aria-label="Date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="h-11 rounded-xl border border-zinc-200 bg-transparent px-3 text-sm outline-none dark:border-zinc-700"
                        />
                        <button
                            type="button"
                            onClick={() => {
                                const nextNote = window.prompt("Note");
                                if (nextNote !== null) setNotes(nextNote);
                            }}
                            className="h-11 rounded-xl bg-zinc-100 px-4 text-sm font-medium dark:bg-zinc-800"
                        >
                            {notes ? "Edit note" : "+ Note"}
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={!amount || Number(amount) <= 0 || !fundName || isLoading}
                        className="mt-5 h-12 w-full rounded-xl bg-zinc-900 text-sm font-semibold text-white disabled:bg-zinc-200 disabled:text-zinc-400 dark:bg-zinc-100 dark:text-zinc-950 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600"
                    >
                        {isLoading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : transaction ? "Save changes" : "Add transaction"}
                    </button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
