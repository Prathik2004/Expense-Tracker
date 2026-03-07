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
import { Loader2 } from "lucide-react";

interface AddGoalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function AddGoalModal({ isOpen, onClose, onSuccess }: AddGoalProps) {
    const [name, setName] = useState("");
    const [targetAmount, setTargetAmount] = useState("");
    const [deadline, setDeadline] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !targetAmount || !deadline) {
            setError("Please fill all required fields");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            await api.post("/goals", {
                title: name,
                targetAmount: parseFloat(targetAmount),
                deadline: new Date(deadline).toISOString()
            });
            onSuccess();
            onClose();
            // Reset form
            setName("");
            setTargetAmount("");
            setDeadline("");
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to add goal");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Financial Goal</DialogTitle>
                    <DialogDescription>
                        Set a new target to save for.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <div className="text-sm font-medium text-destructive">{error}</div>}

                    <div className="space-y-2">
                        <Label htmlFor="name">Goal Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g. New Camera, Emergency Fund"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="targetAmount">Target Amount (₹)</Label>
                        <Input
                            id="targetAmount"
                            type="number"
                            placeholder="0.00"
                            value={targetAmount}
                            onChange={(e) => setTargetAmount(e.target.value)}
                            required
                            min="1"
                            step="0.01"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="deadline">Target Deadline</Label>
                        <Input
                            id="deadline"
                            type="date"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            required
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Create Goal
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
