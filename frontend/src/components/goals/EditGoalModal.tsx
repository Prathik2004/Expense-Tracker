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

interface EditGoalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    goal: {
        _id: string;
        title?: string;
        name?: string;
        targetAmount: number;
        deadline: string;
    } | null;
}

export function EditGoalModal({ isOpen, onClose, onSuccess, goal }: EditGoalProps) {
    const [name, setName] = useState("");
    const [targetAmount, setTargetAmount] = useState("");
    const [deadline, setDeadline] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (goal) {
            setName(goal.title || goal.name || "");
            setTargetAmount(goal.targetAmount.toString());
            // Format ISO date to YYYY-MM-DD for input type="date"
            const date = new Date(goal.deadline);
            const formattedDate = date.toISOString().split('T')[0];
            setDeadline(formattedDate);
        }
    }, [goal, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !targetAmount || !deadline) {
            setError("Please fill all required fields");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            await api.patch(`/goals/${goal?._id}`, {
                title: name,
                targetAmount: parseFloat(targetAmount),
                deadline: new Date(deadline).toISOString()
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to update goal");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Financial Goal</DialogTitle>
                    <DialogDescription>
                        Update your target settings.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <div className="text-sm font-medium text-destructive">{error}</div>}

                    <div className="space-y-2">
                        <Label htmlFor="edit-name">Goal Name</Label>
                        <Input
                            id="edit-name"
                            placeholder="e.g. New Camera, Emergency Fund"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-targetAmount">Target Amount (₹)</Label>
                        <Input
                            id="edit-targetAmount"
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
                        <Label htmlFor="edit-deadline">Target Deadline</Label>
                        <Input
                            id="edit-deadline"
                            type="date"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            required
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Update Goal
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
