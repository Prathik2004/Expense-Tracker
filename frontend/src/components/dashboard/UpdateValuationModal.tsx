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
import { Loader2 } from "lucide-react";

interface UpdateValuationProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    currentValuation: number;
}

export function UpdateValuationModal({ isOpen, onClose, onSuccess, currentValuation }: UpdateValuationProps) {
    const [amount, setAmount] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen) {
            setAmount(currentValuation > 0 ? currentValuation.toString() : "");
            setError("");
        }
    }, [isOpen, currentValuation]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount) {
            setError("Please enter a valuation amount");
            return;
        }

        const val = parseFloat(amount);
        if (val < 0) {
            setError("Amount cannot be negative");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            await api.patch("/users/portfolio", { portfolioValue: val });
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to update valuation");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Update Portfolio Valuation</DialogTitle>
                    <DialogDescription>
                        Enter the current market value of all your investments.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <div className="text-sm font-medium text-destructive">{error}</div>}

                    <div className="space-y-2">
                        <Label htmlFor="valuationAmount">Current Market Value (₹)</Label>
                        <Input
                            id="valuationAmount"
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                            min="0"
                            step="0.01"
                            className="text-2xl h-12"
                        />
                    </div>

                    <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white" disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Save Valuation
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
