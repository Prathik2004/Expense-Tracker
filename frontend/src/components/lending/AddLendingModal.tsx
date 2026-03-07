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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface AddLendingProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    lending?: any; // Optional lending for editing
}

export function AddLendingModal({ isOpen, onClose, onSuccess, lending }: AddLendingProps) {
    const isEdit = !!lending;

    const [personName, setPersonName] = useState(lending?.personName || "");
    const [reason, setReason] = useState(lending?.reason || "");
    const [amount, setAmount] = useState(lending?.amount?.toString() || "");
    const [date, setDate] = useState(lending?.date ? new Date(lending.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    const [source, setSource] = useState<"salary" | "other">(lending?.source || "other");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen) {
            setPersonName(lending?.personName || "");
            setReason(lending?.reason || "");
            setAmount(lending?.amount?.toString() || "");
            setDate(lending?.date ? new Date(lending.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
            setSource(lending?.source || "other");
            setError("");
        }
    }, [isOpen, lending]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!personName || !reason || !amount || !date) {
            setError("Please fill all required fields");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const data = {
                personName,
                reason,
                amount: parseFloat(amount),
                date: new Date(date).toISOString(),
                source
            };

            if (isEdit) {
                await api.patch(`/lending/${lending._id}`, data);
            } else {
                await api.post("/lending", data);
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'add'} lending record`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] w-[95vw] p-4 sm:p-6 rounded-xl">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit Lending' : 'Add Lending'}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? 'Update the details of this lending record' : 'Keep track of money you lent someone'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 mt-2">
                    {error && <div className="text-sm font-medium text-destructive">{error}</div>}

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="personName" className="text-zinc-500">Person Name</Label>
                            <Input
                                id="personName"
                                placeholder="Who did you lend it to?"
                                value={personName}
                                onChange={(e) => setPersonName(e.target.value)}
                                className="h-12"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reason" className="text-zinc-500">Reason / Purpose</Label>
                            <Input
                                id="reason"
                                placeholder="What was it for?"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="h-12"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="amount" className="text-zinc-500">Amount (₹)</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    inputMode="decimal"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="h-12 font-medium"
                                    required
                                    min="0"
                                    step="0.01"
                                />
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
                            <Label className="text-zinc-500">Fund Source</Label>
                            <div className="flex bg-zinc-100 dark:bg-zinc-900 rounded-lg p-1">
                                <button
                                    type="button"
                                    className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${source === 'salary' ? 'bg-white shadow-sm dark:bg-zinc-800 text-primary' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'}`}
                                    onClick={() => setSource('salary')}
                                >
                                    Salary A/C
                                </button>
                                <button
                                    type="button"
                                    className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${source === 'other' ? 'bg-white shadow-sm dark:bg-zinc-800 text-primary' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'}`}
                                    onClick={() => setSource('other')}
                                >
                                    Other A/C
                                </button>
                            </div>
                            <p className="text-[11px] text-zinc-500 px-1">
                                {source === 'salary'
                                    ? "Will be added to your transaction log as an expense."
                                    : "Won't appear in your main transaction log."}
                            </p>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-12 text-base font-semibold"
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> :
                            isEdit ? 'Update Lending Record' : 'Save Lending Record'
                        }
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
